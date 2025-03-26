// État du jeu
const gameState = {
    player: {
        level: 1,
        hp: 100,
        maxHp: 100,
        attack: 20,
        class: 'default',
        skin: 'default',
        inventory: {
            armor: [],
            weapons: [],
            consumables: []
        },
        equipped: {
            armor: null,
            weapon: null
        },
        coins: 0,
        diamonds: 0,
        unlockedSkins: {
            paladin: [true, true, false],
            guerrier: [true, true, false],
            mage: [true, true, false],
            archer: [true, true, false]
        }
    },
    currentMonster: null,
    monsters: [
        { name: 'Slime', hp: 50, attack: 10, image: 'slime.png', drops: ['potion', 'slime_essence'], coins: 5 },
        { name: 'Gobelin', hp: 80, attack: 15, image: 'goblin.png', drops: ['sword', 'shield'], coins: 10 },
        { name: 'Squelette', hp: 60, attack: 20, image: 'skeleton.png', drops: ['bone', 'armor'], coins: 15 }
    ],
    items: {
        potion: { name: 'Potion', type: 'heal', value: 30, image: 'potion.png' },
        slime_essence: { name: 'Essence de Slime', type: 'material', value: 10, image: 'slime_essence.png' },
        sword: { name: 'Épée', type: 'weapon', value: 25, image: 'sword.png' },
        shield: { name: 'Bouclier', type: 'armor', value: 20, image: 'shield.png' },
        bone: { name: 'Os', type: 'material', value: 15, image: 'bone.png' },
        armor: { name: 'Armure', type: 'armor', value: 30, image: 'armor.png' }
    },
    classSkins: {
        paladin: [
            { name: 'Paladin Or', image: 'paladin_gold.png', price: 0 },
            { name: 'Paladin Argent', image: 'paladin_silver.png', price: 0 },
            { name: 'Paladin Bronze', image: 'paladin_bronze.png', price: 100 },
            { name: 'Paladin Légendaire', image: 'paladin_legendary.png', diamondPrice: 500 }
        ],
        guerrier: [
            { name: 'Guerrier Rouge', image: 'warrior_red.png', price: 0 },
            { name: 'Guerrier Bleu', image: 'warrior_blue.png', price: 0 },
            { name: 'Guerrier Noir', image: 'warrior_black.png', price: 100 },
            { name: 'Guerrier Légendaire', image: 'warrior_legendary.png', diamondPrice: 500 }
        ],
        mage: [
            { name: 'Mage Feu', image: 'mage_fire.png', price: 0 },
            { name: 'Mage Glace', image: 'mage_ice.png', price: 0 },
            { name: 'Mage Arcane', image: 'mage_arcane.png', price: 100 },
            { name: 'Mage Légendaire', image: 'mage_legendary.png', diamondPrice: 500 }
        ],
        archer: [
            { name: 'Archer Forestier', image: 'archer_forest.png', price: 0 },
            { name: 'Archer Urbain', image: 'archer_urban.png', price: 0 },
            { name: 'Archer Royal', image: 'archer_royal.png', price: 100 },
            { name: 'Archer Légendaire', image: 'archer_legendary.png', diamondPrice: 500 }
        ]
    },
    floatingDamage: [] // Pour stocker les dégâts flottants actifs
};

// Éléments DOM
const characterCreation = document.getElementById('character-creation');
const gameScreen = document.getElementById('game-screen');
const inventoryScreen = document.getElementById('inventory-screen');
const diamondsScreen = document.getElementById('diamonds-screen');
const characterSprite = document.getElementById('character-sprite');
const monsterSprite = document.getElementById('monster-sprite');
const levelDisplay = document.getElementById('level');
const hpDisplay = document.getElementById('hp');
const maxHpDisplay = document.getElementById('max-hp');
const coinsDisplay = document.getElementById('coins');
const diamondsDisplay = document.getElementById('diamonds');
const inventoryGrid = document.getElementById('inventory-items');
const skinOptions = document.getElementById('skin-options');

// Gestionnaires d'événements pour la personnalisation
document.querySelectorAll('.class-option').forEach(button => {
    button.addEventListener('click', () => {
        // Retirer la sélection des autres boutons de classe
        document.querySelectorAll('.class-option').forEach(btn => btn.classList.remove('selected'));
        // Ajouter la sélection au bouton cliqué
        button.classList.add('selected');
        
        gameState.player.class = button.dataset.class;
        updateSkinOptions();
    });
});

document.getElementById('customize-character').addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    characterCreation.classList.remove('hidden');
    // Mettre à jour les options de skin avec la classe actuelle
    updateSkinOptions();
    // Sélectionner la classe actuelle
    document.querySelectorAll('.class-option').forEach(btn => {
        if (btn.dataset.class === gameState.player.class) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
});

// Système de pièces automatiques
setInterval(() => {
    if (gameScreen.classList.contains('hidden') === false) {
        gameState.player.coins += 1;
        updateDisplay();
    }
}, 30000);

function updateSkinOptions() {
    // Vider les options de skin actuelles
    skinOptions.innerHTML = '';
    
    // Ajouter les nouveaux skins pour la classe sélectionnée
    gameState.classSkins[gameState.player.class].forEach((skin, index) => {
        const skinElement = document.createElement('div');
        skinElement.className = 'skin-option';
        
        if (gameState.player.unlockedSkins[gameState.player.class][index]) {
            skinElement.innerHTML = `
                <img src="assets/characters/${skin.image}" alt="${skin.name}">
                <p>${skin.name}</p>
            `;
            skinElement.addEventListener('click', () => {
                document.querySelectorAll('.skin-option').forEach(opt => opt.classList.remove('selected'));
                skinElement.classList.add('selected');
                gameState.player.skin = skin.image;
                updateCharacterSprite();
                updateStartButton();
            });
        } else {
            skinElement.innerHTML = `
                <img src="assets/characters/${skin.image}" alt="${skin.name}" class="locked">
                <p>${skin.name}</p>
                ${skin.diamondPrice ? 
                    `<p class="price">${skin.diamondPrice} 💎</p>
                     <button class="unlock-button" onclick="unlockSkinWithDiamonds('${gameState.player.class}', ${index})">Débloquer avec 💎</button>` :
                    `<p class="price">${skin.price} pièces</p>
                     <button class="unlock-button" onclick="unlockSkin('${gameState.player.class}', ${index})">Débloquer</button>`
                }
            `;
        }
        
        skinOptions.appendChild(skinElement);
    });
}

function updateStartButton() {
    const startButton = document.getElementById('start-game');
    startButton.disabled = gameState.player.skin === 'default';
}

function unlockSkin(className, index) {
    const skin = gameState.classSkins[className][index];
    if (gameState.player.coins >= skin.price) {
        gameState.player.coins -= skin.price;
        gameState.player.unlockedSkins[className][index] = true;
        updateDisplay();
        updateSkinOptions();
    } else {
        alert('Vous n\'avez pas assez de pièces !');
    }
}

function unlockSkinWithDiamonds(className, index) {
    const skin = gameState.classSkins[className][index];
    if (gameState.player.diamonds >= skin.diamondPrice) {
        gameState.player.diamonds -= skin.diamondPrice;
        gameState.player.unlockedSkins[className][index] = true;
        updateDisplay();
        updateSkinOptions();
    } else {
        alert('Vous n\'avez pas assez de diamants !');
    }
}

function updateCharacterSprite() {
    characterSprite.src = `assets/characters/${gameState.player.skin}`;
}

document.getElementById('start-game').addEventListener('click', () => {
    if (gameState.player.class === 'default') {
        alert('Veuillez choisir une classe avant de commencer !');
        return;
    }
    if (gameState.player.skin === 'default') {
        alert('Veuillez choisir une apparence pour votre personnage avant de commencer !');
        return;
    }
    characterCreation.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    spawnMonster();
});

// Gestionnaires d'événements pour le combat
document.getElementById('attack').addEventListener('click', () => {
    if (gameState.currentMonster) {
        // Dégâts du joueur
        const playerDamage = gameState.player.attack;
        gameState.currentMonster.hp -= playerDamage;
        
        // Créer le nombre de dégâts flottant pour le monstre
        const monsterRect = monsterSprite.getBoundingClientRect();
        const gameScreenRect = gameScreen.getBoundingClientRect();
        createFloatingDamage(
            playerDamage,
            monsterRect.left - gameScreenRect.left + monsterRect.width / 2,
            monsterRect.top - gameScreenRect.top,
            true
        );
        
        if (gameState.currentMonster.hp <= 0) {
            handleMonsterDefeat();
        } else {
            // Dégâts du monstre
            const monsterDamage = gameState.currentMonster.attack;
            gameState.player.hp -= monsterDamage;
            
            // Créer le nombre de dégâts flottant pour le joueur
            const playerRect = characterSprite.getBoundingClientRect();
            createFloatingDamage(
                monsterDamage,
                playerRect.left - gameScreenRect.left + playerRect.width / 2,
                playerRect.top - gameScreenRect.top,
                false
            );
            
            if (gameState.player.hp <= 0) {
                handlePlayerDefeat();
            }
        }
        updateDisplay();
    }
});

// Gestionnaires d'événements pour l'inventaire
document.getElementById('open-inventory').addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    inventoryScreen.classList.remove('hidden');
    updateInventoryDisplay();
});

document.getElementById('close-inventory').addEventListener('click', () => {
    inventoryScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
});

// Gestionnaires d'événements pour l'écran des diamants
document.getElementById('buy-diamonds').addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    diamondsScreen.classList.remove('hidden');
});

document.getElementById('close-diamonds').addEventListener('click', () => {
    diamondsScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
});

// Fonctions utilitaires
function spawnMonster() {
    const randomMonster = gameState.monsters[Math.floor(Math.random() * gameState.monsters.length)];
    gameState.currentMonster = { ...randomMonster, hp: randomMonster.hp };
    monsterSprite.src = `assets/monsters/${randomMonster.image}`;
    updateDisplay();
}

function handleMonsterDefeat() {
    // Ajouter un item aléatoire du monstre à l'inventaire
    const randomDrop = gameState.currentMonster.drops[Math.floor(Math.random() * gameState.currentMonster.drops.length)];
    addItemToInventory(randomDrop);
    
    // Ajouter les pièces du monstre
    gameState.player.coins += gameState.currentMonster.coins;
    
    // Augmenter le niveau et les stats
    gameState.player.level++;
    gameState.player.maxHp += 10;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.attack += 5;
    
    // Spawner un nouveau monstre
    spawnMonster();
}

function handlePlayerDefeat() {
    alert('Game Over! Recommencez la partie.');
    location.reload();
}

function updateDisplay() {
    levelDisplay.textContent = gameState.player.level;
    hpDisplay.textContent = gameState.player.hp;
    maxHpDisplay.textContent = gameState.player.maxHp;
    coinsDisplay.textContent = gameState.player.coins;
    diamondsDisplay.textContent = gameState.player.diamonds;
}

function addItemToInventory(itemId) {
    const item = gameState.items[itemId];
    let targetArray;
    
    // Déterminer la catégorie de l'item
    switch(item.type) {
        case 'armor':
            targetArray = gameState.player.inventory.armor;
            break;
        case 'weapon':
            targetArray = gameState.player.inventory.weapons;
            break;
        default:
            targetArray = gameState.player.inventory.consumables;
    }
    
    // Vérifier si l'item existe déjà dans l'inventaire
    const existingItem = targetArray.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        targetArray.push({ id: itemId, quantity: 1 });
    }
}

function updateInventoryDisplay() {
    inventoryGrid.innerHTML = '';
    
    // Créer les sections pour chaque catégorie
    const categories = [
        { title: 'Armures', items: gameState.player.inventory.armor },
        { title: 'Armes', items: gameState.player.inventory.weapons },
        { title: 'Consommables', items: gameState.player.inventory.consumables }
    ];
    
    categories.forEach(category => {
        if (category.items.length > 0) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.title;
            categoryTitle.className = 'inventory-category';
            inventoryGrid.appendChild(categoryTitle);
            
            category.items.forEach(item => {
                const itemData = gameState.items[item.id];
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                
                // Ajouter la classe equipped si l'item est équipé
                if (itemData.type === 'armor' && gameState.player.equipped.armor === item.id) {
                    itemElement.classList.add('equipped');
                } else if (itemData.type === 'weapon' && gameState.player.equipped.weapon === item.id) {
                    itemElement.classList.add('equipped');
                }
                
                let itemHtml = `
                    <img src="assets/items/${itemData.image}" alt="${itemData.name}">
                    <p>${itemData.name}</p>
                    <p class="quantity">x${item.quantity}</p>
                    <p class="sell-price">Vendre: ${Math.floor(itemData.value * 0.5)} pièces</p>
                `;
                
                // Ajouter les stats pour les équipements
                if (itemData.type === 'armor' || itemData.type === 'weapon') {
                    itemHtml += `<p class="item-stats">+${itemData.value} ${itemData.type === 'armor' ? 'HP' : 'ATK'}</p>`;
                }
                
                itemElement.innerHTML = itemHtml;
                
                // Gérer les clics gauche et droit
                itemElement.addEventListener('click', (e) => {
                    if (e.button === 0) { // Clic gauche
                        if (itemData.type === 'armor' || itemData.type === 'weapon') {
                            equipItem(item.id, itemData.type);
                        } else {
                            useItem(item.id);
                        }
                    }
                });
                
                itemElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    sellItem(item.id, itemData);
                });
                
                inventoryGrid.appendChild(itemElement);
            });
        }
    });
}

function equipItem(itemId, type) {
    const item = gameState.items[itemId];
    const currentEquipped = gameState.player.equipped[type];
    
    // Si l'item est déjà équipé, on le déséquipe
    if (currentEquipped === itemId) {
        gameState.player.equipped[type] = null;
        if (type === 'armor') {
            gameState.player.maxHp -= item.value;
            gameState.player.hp -= item.value;
        } else {
            gameState.player.attack -= item.value;
        }
        updateDisplay();
        updateInventoryDisplay();
        return;
    }
    
    // Déséquiper l'item actuel s'il y en a un
    if (currentEquipped) {
        const currentItem = gameState.items[currentEquipped];
        if (type === 'armor') {
            gameState.player.maxHp -= currentItem.value;
            gameState.player.hp -= currentItem.value;
        } else {
            gameState.player.attack -= currentItem.value;
        }
    }
    
    // Équiper le nouvel item
    gameState.player.equipped[type] = itemId;
    if (type === 'armor') {
        gameState.player.maxHp += item.value;
        gameState.player.hp += item.value;
    } else {
        gameState.player.attack += item.value;
    }
    
    // Mettre à jour l'affichage
    updateDisplay();
    updateInventoryDisplay();
}

function useItem(itemId) {
    const item = gameState.items[itemId];
    const inventoryItem = gameState.player.inventory.consumables.find(item => item.id === itemId);
    
    if (item.type === 'heal' && inventoryItem && inventoryItem.quantity > 0) {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + item.value);
        inventoryItem.quantity -= 1;
        
        if (inventoryItem.quantity <= 0) {
            gameState.player.inventory.consumables = gameState.player.inventory.consumables.filter(item => item.id !== itemId);
        }
        
        updateDisplay();
        updateInventoryDisplay();
    }
}

function sellItem(itemId, itemData) {
    // Vérifier si l'item est équipé
    if ((itemData.type === 'armor' && gameState.player.equipped.armor === itemId) ||
        (itemData.type === 'weapon' && gameState.player.equipped.weapon === itemId)) {
        alert('Vous ne pouvez pas vendre un item équipé !');
        return;
    }
    
    // Trouver l'item dans l'inventaire
    let targetArray;
    switch(itemData.type) {
        case 'armor':
            targetArray = gameState.player.inventory.armor;
            break;
        case 'weapon':
            targetArray = gameState.player.inventory.weapons;
            break;
        default:
            targetArray = gameState.player.inventory.consumables;
    }
    
    const inventoryItem = targetArray.find(item => item.id === itemId);
    
    if (inventoryItem && inventoryItem.quantity > 0) {
        const sellPrice = Math.floor(itemData.value * 0.5); // Prix de vente = 50% de la valeur
        if (confirm(`Vendre ${itemData.name} pour ${sellPrice} pièces ?`)) {
            gameState.player.coins += sellPrice;
            inventoryItem.quantity -= 1;
            
            if (inventoryItem.quantity <= 0) {
                targetArray = targetArray.filter(item => item.id !== itemId);
            }
            
            updateDisplay();
            updateInventoryDisplay();
        }
    }
}

function createFloatingDamage(amount, x, y, isPlayer) {
    const damageElement = document.createElement('div');
    damageElement.className = `floating-damage ${isPlayer ? 'player-damage' : 'monster-damage'}`;
    damageElement.textContent = amount;
    
    // Position initiale
    damageElement.style.left = `${x}px`;
    damageElement.style.top = `${y}px`;
    
    // Ajouter à l'écran de jeu
    gameScreen.appendChild(damageElement);
    
    // Animation
    let opacity = 1;
    let yOffset = 0;
    
    const animate = () => {
        opacity -= 0.02;
        yOffset -= 1;
        
        damageElement.style.opacity = opacity;
        damageElement.style.transform = `translateY(${yOffset}px)`;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            damageElement.remove();
        }
    };
    
    requestAnimationFrame(animate);
}

// Initialisation
updateCharacterSprite();
updateDisplay();
updateStartButton(); 