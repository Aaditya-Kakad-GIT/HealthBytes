const foodDatabase = {
    apple: {
        name: "Apple",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        fiber: 2.4,
        sugar: 10,
        calcium: 6,
        iron: 0.1
    },
    banana: {
        name: "Banana", 
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        fiber: 2.6,
        sugar: 12,
        calcium: 5,
        iron: 0.3
    },
    "chicken breast": {
        name: "Chicken Breast",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        sugar: 0,
        calcium: 15,
        iron: 0.9
    },
    rice: {
        name: "White Rice",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fats: 0.3,
        fiber: 0.4,
        sugar: 0.1,
        calcium: 10,
        iron: 0.8
    },
    salmon: {
        name: "Salmon",
        calories: 208,
        protein: 25,
        carbs: 0,
        fats: 12,
        fiber: 0,
        sugar: 0,
        calcium: 9,
        iron: 0.3
    },
    broccoli: {
        name: "Broccoli",
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fats: 0.4,
        fiber: 2.6,
        sugar: 1.5,
        calcium: 47,
        iron: 0.7
    },
    eggs: {
        name: "Eggs",
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fats: 11,
        fiber: 0,
        sugar: 1.1,
        calcium: 50,
        iron: 1.2
    },
    avocado: {
        name: "Avocado",
        calories: 160,
        protein: 2,
        carbs: 9,
        fats: 15,
        fiber: 7,
        sugar: 0.7,
        calcium: 12,
        iron: 0.6
    },
    spinach: {
        name: "Spinach",
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fats: 0.4,
        fiber: 2.2,
        sugar: 0.4,
        calcium: 99,
        iron: 2.7
    },
    oats: {
        name: "Oats",
        calories: 389,
        protein: 17,
        carbs: 66,
        fats: 7,
        fiber: 11,
        sugar: 1,
        calcium: 54,
        iron: 5
    }
};

// Global variables
let currentUser = null;
let searchHistory = [];
let savedMeals = [];
let isDarkMode = false;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    initializeEventListeners();
    loadThemePreference();
    showPage('homePage');
});

// Set up all event listeners
function initializeEventListeners() {
    // Home page button
    document.getElementById('beginJourneyBtn').addEventListener('click', function() {
        showPage('userInputPage');
    });

    // User form submission
    document.getElementById('userDetailsForm').addEventListener('submit', handleUserForm);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', searchFood);
    document.getElementById('foodSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchFood();
        }
    });

    // Make functions available globally
    window.quickSearch = quickSearch;
    window.showPage = showPage;
    window.saveMeal = saveMeal;
    window.removeSavedMeal = removeSavedMeal;
    window.toggleDarkMode = toggleDarkMode;
}

// Dark mode toggle functionality
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    const darkModeBtn = document.getElementById('darkModeToggle');
    
    if (isDarkMode) {
        body.setAttribute('data-theme', 'dark');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        showNotification('Dark mode enabled', 'success');
    } else {
        body.removeAttribute('data-theme');
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        showNotification('Light mode enabled', 'success');
    }
    
    // Save theme preference
    localStorage.setItem('darkMode', isDarkMode);
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        isDarkMode = true;
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Show specific page and hide others
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update navigation active states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Update page-specific content
    if (pageId === 'detailsPage') {
        updateDetailsPage();
    } else if (pageId === 'searchPage') {
        updateSavedMeals();
    }
}

// Handle user form submission
function handleUserForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const medicalHistory = [];
    
    // Get checked medical conditions
    document.querySelectorAll('input[name="medical"]:checked').forEach(checkbox => {
        medicalHistory.push(checkbox.value);
    });
    
    // Create user object
    currentUser = {
        weight: formData.get('weight'),
        age: formData.get('age'), 
        purpose: formData.get('purpose'),
        medicalHistory: medicalHistory,
        joinDate: new Date().toISOString()
    };
    
    saveUserData();
    showNotification('Profile saved successfully!', 'success');
    
    setTimeout(() => {
        showPage('searchPage');
    }, 1000);
}

// Search for food using API or local database
async function searchFood() {
    const searchTerm = document.getElementById('foodSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        showNotification('Please enter a food name to search', 'error');
        return;
    }
    
    showLoadingSpinner();
    
    try {
        // Try API first, then fallback to local database
        let foodData = await searchFoodAPI(searchTerm);
        
        if (!foodData) {
            foodData = searchLocalDatabase(searchTerm);
        }
        
        if (foodData) {
            displaySearchResults([foodData]);
            addToSearchHistory(searchTerm);
        } else {
            displayNoResults(searchTerm);
        }
    } catch (error) {
        console.error('Search error:', error);
        // Fallback to local database
        const localResult = searchLocalDatabase(searchTerm);
        if (localResult) {
            displaySearchResults([localResult]);
            addToSearchHistory(searchTerm);
        } else {
            displayNoResults(searchTerm);
        }
    }
    
    hideLoadingSpinner();
    document.getElementById('foodSearch').value = '';
}

// Search food using Edamam Nutrition API (disabled for reliability)
async function searchFoodAPI(searchTerm) {
   
    return null;
    
   
}

// Search local database as fallback
function searchLocalDatabase(searchTerm) {
    const key = Object.keys(foodDatabase).find(key => 
        key === searchTerm || key.includes(searchTerm) || foodDatabase[key].name.toLowerCase().includes(searchTerm)
    );
    
    return key ? foodDatabase[key] : null;
}

// Quick search function
function quickSearch(query) {
    document.getElementById('foodSearch').value = query;
    searchFood();
}

// Show loading spinner
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('searchResults').innerHTML = '';
}

// Hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    results.forEach(food => {
        const foodCard = createFoodCard(food);
        resultsContainer.appendChild(foodCard);
    });
}

// Create food card element
function createFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-card';
    
    card.innerHTML = `
        <h3>${food.name}</h3>
        <div class="nutrition-grid">
            <div class="nutrition-item">
                <span class="nutrition-value">${food.calories}</span>
                <span class="nutrition-label">Calories</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${food.protein}g</span>
                <span class="nutrition-label">Protein</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${food.carbs}g</span>
                <span class="nutrition-label">Carbs</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${food.fats}g</span>
                <span class="nutrition-label">Fats</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${food.fiber}g</span>
                <span class="nutrition-label">Fiber</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${food.calcium}mg</span>
                <span class="nutrition-label">Calcium</span>
            </div>
        </div>
        <button class="save-btn" onclick="saveMeal('${food.name}')">
            <i class="fas fa-bookmark"></i> Save Meal
        </button>
    `;
    
    return card;
}

// Display no results message
function displayNoResults(searchTerm) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
        <div class="no-results" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h3>No results found for "${searchTerm}"</h3>
            <p>Try searching for: apple, banana, chicken breast, rice, salmon, broccoli, eggs, avocado, spinach, or oats</p>
        </div>
    `;
}

// Save meal to favorites
function saveMeal(foodName) {
    const existingMeal = savedMeals.find(meal => meal.name === foodName);
    
    if (!existingMeal) {
        savedMeals.push({
            name: foodName,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        });
        saveUserData();
        updateSavedMeals();
        showNotification(`${foodName} saved to your meals! 🍽️`, 'success');
    } else {
        showNotification(`${foodName} is already saved`, 'error');
    }
}

// Remove saved meal
function removeSavedMeal(index) {
    const mealName = savedMeals[index].name;
    savedMeals.splice(index, 1);
    saveUserData();
    updateSavedMeals();
    showNotification(`${mealName} removed from saved meals`, 'success');
}

// Update saved meals display
function updateSavedMeals() {
    const container = document.getElementById('savedMeals');
    
    if (savedMeals.length === 0) {
        container.innerHTML = '<p class="no-saved">No saved meals yet. Search for foods and save them!</p>';
        return;
    }
    
    container.innerHTML = savedMeals.map((meal, index) => `
        <div class="saved-meal">
            <h4>${meal.name}</h4>
            <p>Saved: ${meal.date}</p>
            <div style="margin-top: 0.8rem;">
                <button class="save-btn" onclick="quickSearch('${meal.name}')" style="background: var(--gradient-primary); margin-right: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem;">
                    <i class="fas fa-search"></i> View
                </button>
                <button class="save-btn" onclick="removeSavedMeal(${index})" style="background: #ef4444; padding: 0.5rem 1rem; font-size: 0.9rem;">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// Add search to history
function addToSearchHistory(searchTerm) {
    const historyItem = {
        term: searchTerm,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning and limit to 20 items
    searchHistory.unshift(historyItem);
    searchHistory = searchHistory.slice(0, 20);
    
    saveUserData();
}

// Update details page
function updateDetailsPage() {
    updateUserInfo();
    updateSearchHistoryDisplay();
}

// Update user info display
function updateUserInfo() {
    const userInfoContainer = document.getElementById('userInfo');
    
    if (!currentUser) {
        userInfoContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <i class="fas fa-user-plus" style="font-size: 2rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                <p>Complete your profile to see your information here</p>
                <button class="cta-button" onclick="showPage('userInputPage')" style="margin-top: 1rem; padding: 0.8rem 1.5rem; font-size: 0.9rem;">
                    Complete Profile
                </button>
            </div>
        `;
        return;
    }
    
    const medicalHistoryText = currentUser.medicalHistory.length > 0 
        ? currentUser.medicalHistory.join(', ').replace(/_/g, ' ')
        : 'None reported';
    
    userInfoContainer.innerHTML = `
        <div style="text-align: left;">
            <div style="background: var(--secondary-bg); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; border: 2px solid var(--border-color);">
                <p style="margin-bottom: 0.5rem;"><strong><i class="fas fa-user" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Age:</strong> ${currentUser.age} years</p>
                <p style="margin-bottom: 0.5rem;"><strong><i class="fas fa-weight" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Weight:</strong> ${currentUser.weight} kg</p>
                <p style="margin-bottom: 0.5rem;"><strong><i class="fas fa-notes-medical" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Medical History:</strong> ${medicalHistoryText}</p>
                <p style="margin-bottom: 0.5rem;"><strong><i class="fas fa-target" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Purpose:</strong> ${currentUser.purpose}</p>
                <p><strong><i class="fas fa-calendar" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Member Since:</strong> ${new Date(currentUser.joinDate).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

// Update search history display
function updateSearchHistoryDisplay() {
    const historyContainer = document.getElementById('searchHistory');
    
    if (searchHistory.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <i class="fas fa-search" style="font-size: 2rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                <p>No searches yet. Start exploring foods!</p>
            </div>
        `;
        return;
    }
    
    const recentSearches = searchHistory.slice(0, 10);
    
    historyContainer.innerHTML = `
        <div style="text-align: left;">
            <div style="background: var(--secondary-bg); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; border: 2px solid var(--border-color);">
                <p style="margin-bottom: 1rem;"><strong><i class="fas fa-chart-bar" style="color: var(--accent-color); margin-right: 0.5rem;"></i>Total searches:</strong> ${searchHistory.length}</p>
                <h4 style="color: var(--accent-color); margin-bottom: 0.8rem;"><i class="fas fa-history" style="margin-right: 0.5rem;"></i>Recent searches:</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${recentSearches.map(item => `
                        <div onclick="quickSearch('${item.term}')" style="
                            cursor: pointer; 
                            color: var(--accent-color); 
                            padding: 0.5rem; 
                            border-radius: 5px;
                            margin-bottom: 0.3rem;
                            background: var(--primary-bg);
                            border: 1px solid var(--border-color);
                            transition: all 0.3s ease;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        " onmouseover="this.style.background='var(--accent-color)'; this.style.color='white';" onmouseout="this.style.background='var(--primary-bg)'; this.style.color='var(--accent-color)';">
                            <span><i class="fas fa-search" style="margin-right: 0.5rem;"></i>${item.term}</span>
                            <small>${item.date}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span style="margin-left: 0.5rem;">${message}</span>
    `;
    
    document.getElementById('notifications').appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Save user data to localStorage
function saveUserData() {
    const userData = {
        currentUser,
        searchHistory,
        savedMeals,
        darkMode: isDarkMode
    };
    localStorage.setItem('healthBytesData', JSON.stringify(userData));
}

// Load user data from localStorage
function loadUserData() {
    const savedData = localStorage.getItem('healthBytesData');
    if (savedData) {
        const userData = JSON.parse(savedData);
        currentUser = userData.currentUser || null;
        searchHistory = userData.searchHistory || [];
        savedMeals = userData.savedMeals || [];
        isDarkMode = userData.darkMode || false;
    }
}
function toggleDarkMode() {
  const body = document.body;
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
  } else {
    body.setAttribute('data-theme', 'dark');
  }
  // save preference to localStorage if desired
}