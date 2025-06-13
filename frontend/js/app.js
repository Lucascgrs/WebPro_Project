// Application principale
const App = {
    // Initialisation de l'application
    init: function() {
        UI.init();
        this.loadInitialPage();
    },

    // Charge la page initiale en fonction de l'état d'authentification
    loadInitialPage: function() {
        console.log('Loading initial page...');
        
        if (Auth.isAuthenticated()) {
            console.log('User is authenticated, loading books page');
            
            // Get current user data and update navigation
            Api.getCurrentUser().then(() => {
                console.log('User data loaded, updating navigation');
                UI.updateNavigation();
                this.loadPage('books');
            }).catch(() => {
                console.log('Failed to get user data, redirecting to login');
                this.loadPage('login');
            });
        } else {
            console.log('User not authenticated, loading login page');
            this.loadPage('login');
        }
    },

    // Charge une page spécifique
    loadPage: function(page) {
        // Vérifier si la page nécessite une authentification
        const authRequiredPages = ['books', 'profile', 'users', 'loans', 'my-loans'];
        if (authRequiredPages.includes(page) && !Auth.isAuthenticated()) {
            UI.showMessage('Vous devez être connecté pour accéder à cette page', 'error');
            page = 'login';
        }
    
        // Vérifier si la page nécessite des droits d'admin
        const adminRequiredPages = ['users', 'loans'];
        const user = Auth.getUser();
        if (adminRequiredPages.includes(page) && (!user || !user.is_admin)) {
            UI.showMessage('Accès non autorisé. Droits d\'administrateur requis.', 'error');
            page = 'books';
        }

        // Charger le contenu de la page
        switch (page) {
            case 'login':
                this.loadLoginPage();
                break;
            case 'register':
                this.loadRegisterPage();
                break;
            case 'books':
                this.loadBooksPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'users':
                this.loadUsersPage();
                break;
            case 'loans':
                this.loadLoansPage();
                break;
            case 'my-loans':
                this.loadMyLoansPage();
                break;
            case 'dashboard':
                this.loadDashboardPage();
                break;
            default:
                this.loadLoginPage();
        }

        // Mettre à jour la navigation active
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === page);
        });
    },

    // Charge la page de connexion
    loadLoginPage: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Connexion</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-block">Se connecter</button>
                </form>
            </div>
        `;
    
        UI.setContent(html);
    
        // Configurer le formulaire de connexion
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
    
            try {
                await Api.login(email, password);
                UI.updateNavigation();
                UI.showMessage('Connexion réussie', 'success');
                this.loadPage('books');
            } catch (error) {
                console.error('Erreur de connexion:', error);
            }
        });
    },

    // Charge la page d'inscription
    loadRegisterPage: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Inscription</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="full_name">Nom complet</label>
                        <input type="text" id="full_name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm_password">Confirmer le mot de passe</label>
                        <input type="password" id="confirm_password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-block">S'inscrire</button>
                </form>
            </div>
        `;
    
        UI.setContent(html);
    
        // Configurer le formulaire d'inscription
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const fullName = document.getElementById('full_name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
    
            // Vérifier que les mots de passe correspondent
            if (password !== confirmPassword) {
                UI.showMessage('Les mots de passe ne correspondent pas', 'error');
                return;
            }
    
            // Vérifier la longueur du mot de passe
            if (password.length < 8) {
                UI.showMessage('Le mot de passe doit contenir au moins 8 caractères', 'error');
                return;
            }
    
            // Vérifier que le nom complet n'est pas vide
            if (fullName.trim().length < 1) {
                UI.showMessage('Le nom complet est requis', 'error');
                return;
            }
    
            try {
                const userData = {
                    full_name: fullName,
                    email: email,
                    password: password
                };
    
                await Api.register(userData);
                UI.showMessage('Inscription réussie', 'success');
                this.loadPage('login');
            } catch (error) {
                console.error('Erreur', error);
                UI.showMessage(error.message || 'Une erreur est survenue', 'error');
            }
        });
    },

    // Charge la page des livres
    loadBooksPage: async function() {
        UI.showLoading();
    
        try {
            // Nous n'avons plus besoin de charger les catégories
            const books = await Api.getBooks();
            const user = Auth.getUser();
            const isAdmin = user && user.is_admin;
    
            let html = `
                <div class="books-page">
                    <div class="books-header">
                        <h2 class="mb-20">Catalogue de Livres</h2>
                        <div class="books-actions">
                            ${isAdmin ? '<button class="btn" id="add-book-btn">Ajouter un livre</button>' : ''}
                            <button class="btn" id="search-books-btn">Recherche avancée</button>
                        </div>
                    </div>
                    
                    <div class="search-section" id="search-section" style="display: none;">
                        <div class="search-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <input type="text" id="search-query" placeholder="Rechercher par titre, auteur, ISBN..." class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="text" id="search-author" placeholder="Auteur" class="form-control">
                                </div>
                                <div class="form-group">
                                    <input type="number" id="search-year" placeholder="Année" class="form-control">
                                </div>
                                <div class="form-group">
                                    <button class="btn" id="perform-search-btn">Rechercher</button>
                                    <button class="btn" id="clear-search-btn">Effacer</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-container" id="books-container">
            `;

            if (books.length === 0) {
                html += `<p>Aucun livre disponible.</p>`;
            } else {
                books.forEach(book => {
                    html += this.createBookCard(book, isAdmin);
                });
            }

            html += `</div></div>`;

            UI.setContent(html);
            
            // Setup event listeners
            this.setupBooksEventListeners(isAdmin);
            
        } catch (error) {
            console.error('Erreur lors du chargement des livres:', error);
            UI.setContent(`<p>Erreur lors du chargement des livres. Veuillez réessayer.</p>`);
        }
    },

    // Create a book card HTML
    createBookCard: function(book, isAdmin = false) {
        return `
            <div class="card" data-book-id="${book.id}">
                <div class="card-header">
                    <h3>${book.title}</h3>
                </div>
                <div class="card-body">
                    <p><strong>Auteur:</strong> ${book.author}</p>
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Année:</strong> ${book.publication_year}</p>
                    <p><strong>Disponible:</strong> ${book.quantity} exemplaire(s)</p>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="App.viewBookDetails(${book.id})">Voir détails</button>
                    ${isAdmin ? `
                        <button class="btn btn-edit" onclick="App.editBook(${book.id})">Modifier</button>
                        <button class="btn btn-danger" onclick="App.deleteBook(${book.id})">Supprimer</button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Setup event listeners for books page
    setupBooksEventListeners: function(isAdmin) {  // Ajout du paramètre isAdmin ici
        // Add book button
        if (isAdmin) {
            const addBookBtn = document.getElementById('add-book-btn');
            if (addBookBtn) {
                addBookBtn.addEventListener('click', () => this.showAddBookForm());
            }
        }
    
        // Search toggle button
        const searchBtn = document.getElementById('search-books-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleSearchSection());
        }
    
        // Perform search button
        const performSearchBtn = document.getElementById('perform-search-btn');
        if (performSearchBtn) {
            performSearchBtn.addEventListener('click', () => this.performBookSearch());
        }
    
        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearBookSearch());
        }
    
        // Search on Enter key
        const searchInputs = ['search-query', 'search-author', 'search-year'];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performBookSearch();
                    }
                });
            }
        });
    },
    // Toggle search section visibility
    toggleSearchSection: function() {
        const searchSection = document.getElementById('search-section');
        if (searchSection) {
            const isVisible = searchSection.style.display !== 'none';
            searchSection.style.display = isVisible ? 'none' : 'block';
            
            const searchBtn = document.getElementById('search-books-btn');
            if (searchBtn) {
                searchBtn.textContent = isVisible ? 'Recherche avancée' : 'Masquer recherche';
            }
        }
    },

    // Perform book search
    performBookSearch: async function() {
        const query = document.getElementById('search-query')?.value.trim();
        const author = document.getElementById('search-author')?.value.trim();
        const year = document.getElementById('search-year')?.value.trim();
    
        const searchParams = {};
        if (query) searchParams.query = query;
        if (author) searchParams.author = author;
        if (year) searchParams.publication_year = parseInt(year);
    
        try {
            UI.showLoading();
            const response = await Api.searchBooks(searchParams);
            const books = response.items || [];
            
            const user = Auth.getUser();
            const isAdmin = user && user.is_admin;
            
            this.displaySearchResults(books, isAdmin);
            UI.hideLoading();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            UI.showMessage('Erreur lors de la recherche', 'error');
            UI.hideLoading();
        }
    },

    // Clear search and reload all books
    clearBookSearch: function() {
        document.getElementById('search-query').value = '';
        document.getElementById('search-author').value = '';
        document.getElementById('search-year').value = '';
        this.loadBooksPage();
    },

    // Display search results
    displaySearchResults: function(books, isAdmin) {
        const container = document.getElementById('books-container');
        if (!container) return;

        if (books.length === 0) {
            container.innerHTML = '<p>Aucun livre trouvé pour cette recherche.</p>';
            return;
        }

        let html = '';
        books.forEach(book => {
            html += this.createBookCard(book, isAdmin);
        });
        
        container.innerHTML = html;
    },

    // Show add book form
    showAddBookForm: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Ajouter un livre</h2>
                <form id="add-book-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="book-title">Titre *</label>
                            <input type="text" id="book-title" class="form-control" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="book-author">Auteur *</label>
                            <input type="text" id="book-author" class="form-control" required maxlength="100">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="book-isbn">ISBN *</label>
                            <input type="text" id="book-isbn" class="form-control" required maxlength="13" minlength="10">
                        </div>
                        <div class="form-group">
                            <label for="book-year">Année de publication *</label>
                            <input type="number" id="book-year" class="form-control" required min="1000" max="${new Date().getFullYear()}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="book-publisher">Éditeur</label>
                            <input type="text" id="book-publisher" class="form-control" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="book-language">Langue</label>
                            <input type="text" id="book-language" class="form-control" maxlength="50">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="book-pages">Nombre de pages</label>
                            <input type="number" id="book-pages" class="form-control" min="1">
                        </div>
                        <div class="form-group">
                            <label for="book-quantity">Quantité *</label>
                            <input type="number" id="book-quantity" class="form-control" required min="0" value="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="book-description">Description</label>
                        <textarea id="book-description" class="form-control" maxlength="1000" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Ajouter le livre</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('books')">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        UI.setContent(html);

        // Setup form handler
        document.getElementById('add-book-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddBook();
        });
    },

    // Handle add book form submission
    handleAddBook: async function() {
        const bookData = {
            title: document.getElementById('book-title').value.trim(),
            author: document.getElementById('book-author').value.trim(),
            isbn: document.getElementById('book-isbn').value.trim(),
            publication_year: parseInt(document.getElementById('book-year').value),
            publisher: document.getElementById('book-publisher').value.trim() || null,
            language: document.getElementById('book-language').value.trim() || null,
            pages: parseInt(document.getElementById('book-pages').value) || null,
            quantity: parseInt(document.getElementById('book-quantity').value),
            description: document.getElementById('book-description').value.trim() || null
        };

        // Validation
        if (!bookData.title || !bookData.author || !bookData.isbn || !bookData.publication_year || bookData.quantity === undefined) {
            UI.showMessage('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        try {
            await Api.createBook(bookData);
            UI.showMessage('Livre ajouté avec succès', 'success');
            this.loadPage('books');
        } catch (error) {
            console.error('Erreur lors de l\'ajout du livre:', error);
            UI.showMessage(error.message || 'Erreur lors de l\'ajout du livre', 'error');
        }
    },

    // Edit book
    editBook: async function(bookId) {
        try {
            UI.showLoading();
            const book = await Api.getBook(bookId);
            UI.hideLoading();
            
            this.showEditBookForm(book);
        } catch (error) {
            console.error('Erreur lors de la récupération du livre:', error);
            UI.hideLoading();
            UI.showMessage('Erreur lors de la récupération du livre', 'error');
        }
    },

    // Show edit book form
    showEditBookForm: function(book) {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Modifier le livre</h2>
                <form id="edit-book-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-title">Titre *</label>
                            <input type="text" id="edit-book-title" class="form-control" required maxlength="100" value="${book.title || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-book-author">Auteur *</label>
                            <input type="text" id="edit-book-author" class="form-control" required maxlength="100" value="${book.author || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-isbn">ISBN *</label>
                            <input type="text" id="edit-book-isbn" class="form-control" required maxlength="13" minlength="10" value="${book.isbn || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-book-year">Année de publication *</label>
                            <input type="number" id="edit-book-year" class="form-control" required min="1000" max="${new Date().getFullYear()}" value="${book.publication_year || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-publisher">Éditeur</label>
                            <input type="text" id="edit-book-publisher" class="form-control" maxlength="100" value="${book.publisher || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-book-language">Langue</label>
                            <input type="text" id="edit-book-language" class="form-control" maxlength="50" value="${book.language || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-pages">Nombre de pages</label>
                            <input type="number" id="edit-book-pages" class="form-control" min="1" value="${book.pages || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-book-quantity">Quantité *</label>
                            <input type="number" id="edit-book-quantity" class="form-control" required min="0" value="${book.quantity || 0}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-book-description">Description</label>
                        <textarea id="edit-book-description" class="form-control" maxlength="1000" rows="3">${book.description || ''}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Modifier le livre</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('books')">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        UI.setContent(html);

        // Setup form handler
        document.getElementById('edit-book-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditBook(book.id);
        });
    },

    // Handle edit book form submission
    handleEditBook: async function(bookId) {
        const bookData = {
            title: document.getElementById('edit-book-title').value.trim(),
            author: document.getElementById('edit-book-author').value.trim(),
            isbn: document.getElementById('edit-book-isbn').value.trim(),
            publication_year: parseInt(document.getElementById('edit-book-year').value),
            publisher: document.getElementById('edit-book-publisher').value.trim() || null,
            language: document.getElementById('edit-book-language').value.trim() || null,
            pages: parseInt(document.getElementById('edit-book-pages').value) || null,
            quantity: parseInt(document.getElementById('edit-book-quantity').value),
            description: document.getElementById('edit-book-description').value.trim() || null
        };

        // Validation
        if (!bookData.title || !bookData.author || !bookData.isbn || !bookData.publication_year || bookData.quantity === undefined) {
            UI.showMessage('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        try {
            await Api.updateBook(bookId, bookData);
            UI.showMessage('Livre modifié avec succès', 'success');
            this.loadPage('books');
        } catch (error) {
            console.error('Erreur lors de la modification du livre:', error);
            UI.showMessage(error.message || 'Erreur lors de la modification du livre', 'error');
        }
    },

    // Delete book with confirmation
    deleteBook: async function(bookId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.')) {
            return;
        }

        try {
            UI.showLoading();
            await Api.deleteBook(bookId);
            UI.hideLoading();
            UI.showMessage('Livre supprimé avec succès', 'success');
            this.loadPage('books');
        } catch (error) {
            console.error('Erreur lors de la suppression du livre:', error);
            UI.hideLoading();
            UI.showMessage(error.message || 'Erreur lors de la suppression du livre', 'error');
        }
    },

    // Affiche les détails d'un livre
    viewBookDetails: async function(bookId) {
        UI.showLoading();

        try {
            const book = await Api.getBook(bookId);

            const html = `
                <div class="book-details">
                    <h2>${book.title}</h2>
                    <div class="book-info">
                        <p><strong>Auteur:</strong> ${book.author}</p>
                        <p><strong>ISBN:</strong> ${book.isbn}</p>
                        <p><strong>Année de publication:</strong> ${book.publication_year}</p>
                        <p><strong>Éditeur:</strong> ${book.publisher || 'Non spécifié'}</p>
                        <p><strong>Langue:</strong> ${book.language || 'Non spécifiée'}</p>
                        <p><strong>Pages:</strong> ${book.pages || 'Non spécifié'}</p>
                        <p><strong>Quantité disponible:</strong> ${book.quantity}</p>
                    </div>
                    <div class="book-description">
                        <h3>Description</h3>
                        <p>${book.description || 'Aucune description disponible.'}</p>
                    </div>
                    <button class="btn mt-20" onclick="App.loadPage('books')">Retour à la liste</button>
                </div>
            `;

            UI.hideLoading();
            UI.setContent(html);
        } catch (error) {
            console.error('Erreur lors du chargement des détails du livre:', error);
            UI.setContent(`
                <p>Erreur lors du chargement des détails du livre. Veuillez réessayer.</p>
                <button class="btn mt-20" onclick="App.loadPage('books')">Retour à la liste</button>
            `);
        }
    },

    loadProfilePage: async function() {
        UI.showLoading();
    
        try {
            let user = Auth.getUser();
    
            if (!user) {
                console.log('No user found in storage, fetching from API...');
                await Api.getCurrentUser();
                user = Auth.getUser();
            }
    
            if (!user) {
                throw new Error('Impossible de récupérer les informations utilisateur');
            }
    
            console.log('User data:', user);
    
            const initials = user.full_name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase();
    
            let html = `
                <div class="profile-container">
                    <div class="profile-header">
                        <div class="profile-avatar">${initials}</div>
                        <h2>${user.full_name}</h2>
                    </div>
                    <div class="profile-info">
                        <div class="profile-info-item">
                            <div class="profile-info-label">Email</div>
                            <div class="profile-info-value">${user.email}</div>
                        </div>
                        <div class="profile-info-item">
                            <div class="profile-info-label">Statut</div>
                            <div class="profile-info-value">${user.is_active ? 'Actif' : 'Inactif'}</div>
                        </div>
                        <div class="profile-info-item">
                            <div class="profile-info-label">Rôle</div>
                            <div class="profile-info-value">${user.is_admin ? 'Administrateur' : 'Utilisateur'}</div>
                        </div>
                        <div class="profile-info-item">
                            <div class="profile-info-label">Téléphone</div>
                            <div class="profile-info-value">${user.phone || 'Non spécifié'}</div>
                        </div>
                        <div class="profile-info-item">
                            <div class="profile-info-label">Adresse</div>
                            <div class="profile-info-value">${user.address || 'Non spécifiée'}</div>
                        </div>
                    </div>
                    <button class="btn" id="edit-profile-btn">Modifier le profil</button>
                </div>
            `;
    
            UI.hideLoading();
            UI.setContent(html);
    
            document.getElementById('edit-profile-btn').addEventListener('click', () => {
                this.loadEditProfilePage(user);
            });
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            UI.hideLoading();
            UI.setContent(`<p>Erreur lors du chargement du profil. Veuillez réessayer.</p>`);
            UI.showMessage(error.message || 'Erreur lors du chargement du profil', 'error');
        }
    },

    // In your frontend/js/app.js, update the loadEditProfilePage function:
    loadEditProfilePage: function(user) {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Modifier le profil</h2>
                
                <!-- Profile photo section -->
                <div class="profile-photo-section">
                    <div class="profile-photo-container" id="photo-upload-area">
                        ${user.profile_photo 
                            ? `<img src="${user.profile_photo}" alt="Photo de profil" class="profile-photo">` 
                            : `<div class="profile-photo-placeholder">
                                <span class="initials">
                                    ${user.full_name.split(' ').map(name => name.charAt(0)).join('').toUpperCase()}
                                </span>
                                <span class="upload-icon">📷</span>
                            </div>`
                        }
                        <div class="photo-overlay">
                            <span class="upload-text">Cliquez pour changer la photo</span>
                        </div>
                    </div>
                    <input type="file" id="profile-photo" accept="image/*" style="display: none;">
                </div>
    
                <!-- Profile form -->
                <form id="edit-profile-form">
                    <div class="form-group">
                        <label for="full_name">Nom complet</label>
                        <input type="text" id="full_name" class="form-control" value="${user.full_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Téléphone</label>
                        <input type="text" id="phone" class="form-control" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="address">Adresse</label>
                        <textarea id="address" class="form-control">${user.address || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-block">Enregistrer les modifications</button>
                </form>
            </div>
        `;
    
        UI.setContent(html);
    
        // Add these styles to your CSS (in frontend/css/style.css or equivalent)
        const styles = `
            <style>
                .profile-photo-section {
                    text-align: center;
                    margin-bottom: 30px;
                }
    
                .profile-photo-container {
                    position: relative;
                    width: 150px;
                    height: 150px;
                    margin: 0 auto;
                    cursor: pointer;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid #e0e0e0;
                    transition: all 0.3s ease;
                }
    
                .profile-photo-container:hover {
                    border-color: #007bff;
                }
    
                .profile-photo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
    
                .profile-photo-placeholder {
                    width: 100%;
                    height: 100%;
                    background-color: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    color: #666;
                }
    
                .initials {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
    
                .upload-icon {
                    font-size: 24px;
                    opacity: 0.7;
                }
    
                .photo-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
    
                .profile-photo-container:hover .photo-overlay {
                    opacity: 1;
                }
    
                .upload-text {
                    color: white;
                    font-size: 14px;
                    text-align: center;
                    padding: 10px;
                }
            </style>
        `;
    
        // Add styles to the document
        document.head.insertAdjacentHTML('beforeend', styles);
    
        // Handle photo upload when clicking anywhere in the photo container
        document.getElementById('photo-upload-area').addEventListener('click', () => {
            document.getElementById('profile-photo').click();
        });
    
        // Handle file selection
        document.getElementById('profile-photo').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    UI.showLoading();
                    
                    const formData = new FormData();
                    formData.append('file', file);
    
                    const updatedUser = await Api.uploadProfilePhoto(formData);
                    
                    UI.hideLoading();
                    UI.showMessage('Photo de profil mise à jour avec succès', 'success');
                    
                    // Reload the current page to show the new photo
                    this.loadEditProfilePage(updatedUser);
                } catch (error) {
                    UI.hideLoading();
                    UI.showMessage('Erreur lors de la mise à jour de la photo de profil', 'error');
                    console.error('Error uploading photo:', error);
                }
            }
        });
    
        // Handle form submission (your existing code)
        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            // Your existing form submission code...
        });
    },

    // =================== USERS MANAGEMENT (ADMIN ONLY) ===================

    // Charge la page de gestion des utilisateurs
    loadUsersPage: async function() {
        UI.showLoading();
    
        try {
            const users = await Api.getUsers();
            const currentUser = Auth.getUser();
    
            let html = `
            <div class="users-page">
                <div class="users-header">
                    <h2 class="mb-20">Gestion des Utilisateurs</h2>
                    <div class="users-actions">
                        <button class="btn" id="search-users-btn">Rechercher</button>
                    </div>
                </div>
                
                <div class="search-section" id="user-search-section" style="display: none;">
                    <div class="search-form">
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" id="search-user-name" placeholder="Rechercher par nom..." class="form-control">
                            </div>
                            <div class="form-group">
                                <input type="email" id="search-user-email" placeholder="Rechercher par email..." class="form-control">
                            </div>
                            <div class="form-group">
                                <input type="number" id="search-user-id" placeholder="Rechercher par ID..." class="form-control">
                            </div>
                            <div class="form-group">
                                <button class="btn" id="perform-user-search-btn">Rechercher</button>
                                <button class="btn" id="clear-user-search-btn">Effacer</button>
                            </div>
                        </div>
                    </div>
                </div>
        `;

            if (users.length === 0) {
                html += `<p>Aucun utilisateur trouvé.</p>`;
            } else {
                users.forEach(user => {
                    html += this.createUserCard(user, currentUser);
                });
            }

            html += `</div></div>`;

            UI.setContent(html);
            
            // Setup event listeners
            this.setupUsersEventListeners();
            
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
            UI.setContent(`<p>Erreur lors du chargement des utilisateurs. Veuillez réessayer.</p>`);
        }
    },

    // Create a user card HTML
    createUserCard: function(user, currentUser) {
        const isCurrentUser = currentUser && user.id === currentUser.id;
        const initials = user.full_name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();

        return `
            <div class="card user-card" data-user-id="${user.id}">
                <div class="card-header">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <h3>${user.full_name} ${isCurrentUser ? '(Vous)' : ''}</h3>
                        <p class="user-email">${user.email}</p>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Rôle:</strong> ${user.is_admin ? 'Administrateur' : 'Utilisateur'}</p>
                    <p><strong>Statut:</strong> 
                        <span class="status ${user.is_active ? 'active' : 'inactive'}">
                            ${user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                    </p>
                    <p><strong>Téléphone:</strong> ${user.phone || 'Non spécifié'}</p>
                    <p><strong>Adresse:</strong> ${user.address || 'Non spécifiée'}</p>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="App.viewUserDetails(${user.id})">Voir détails</button>
                    <button class="btn btn-edit" onclick="App.editUser(${user.id})">Modifier</button>
                    ${!isCurrentUser ? `<button class="btn btn-danger" onclick="App.deleteUser(${user.id})">Supprimer</button>` : ''}
                </div>
            </div>
        `;
    },

    // Setup event listeners for users page
    setupUsersEventListeners: function() {
        // Add user button
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserForm());
        }

        // Search toggle button
        const searchBtn = document.getElementById('search-users-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleUserSearchSection());
        }

        // Perform search button
        const performSearchBtn = document.getElementById('perform-user-search-btn');
        if (performSearchBtn) {
            performSearchBtn.addEventListener('click', () => this.performUserSearch());
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clear-user-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearUserSearch());
        }

        // Search on Enter key
        const searchInput = document.getElementById('search-user-email');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performUserSearch();
                }
            });
        }
    },

    // Toggle user search section visibility
    toggleUserSearchSection: function() {
        const searchSection = document.getElementById('user-search-section');
        if (searchSection) {
            const isVisible = searchSection.style.display !== 'none';
            searchSection.style.display = isVisible ? 'none' : 'block';
            
            const searchBtn = document.getElementById('search-users-btn');
            if (searchBtn) {
                searchBtn.textContent = isVisible ? 'Rechercher' : 'Masquer recherche';
            }
        }
    },

    // Perform user search by email
    performUserSearch: async function() {
        const name = document.getElementById('search-user-name')?.value.trim();
        const email = document.getElementById('search-user-email')?.value.trim();
        const id = document.getElementById('search-user-id')?.value.trim();
    
        if (!name && !email && !id) {
            UI.showMessage('Veuillez saisir au moins un critère de recherche', 'error');
            return;
        }
    
        try {
            UI.showLoading();
            const searchParams = {};
            if (name) searchParams.name = name;
            if (email) searchParams.email = email;
            if (id) searchParams.id = parseInt(id);
    
            const users = await Api.searchUsers(searchParams);
            const currentUser = Auth.getUser();
            
            this.displayUserSearchResults(users, currentUser);
            UI.hideLoading();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            UI.showMessage('Aucun utilisateur trouvé', 'error');
            UI.hideLoading();
        }
    },

    // Clear user search and reload all users
    clearUserSearch: function() {
        document.getElementById('search-user-name').value = '';
        document.getElementById('search-user-email').value = '';
        document.getElementById('search-user-id').value = '';
        this.loadUsersPage();
    },

    // Display user search results
    displayUserSearchResults: function(users, currentUser) {
        const container = document.getElementById('users-container');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<p>Aucun utilisateur trouvé pour cette recherche.</p>';
            return;
        }

        let html = '';
        users.forEach(user => {
            html += this.createUserCard(user, currentUser);
        });
        
        container.innerHTML = html;
    },

    // Show add user form
    showAddUserForm: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Ajouter un utilisateur</h2>
                <form id="add-user-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="user-full-name">Nom complet *</label>
                            <input type="text" id="user-full-name" class="form-control" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="user-email">Email *</label>
                            <input type="email" id="user-email" class="form-control" required maxlength="255">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="user-password">Mot de passe *</label>
                            <input type="password" id="user-password" class="form-control" required minlength="8">
                        </div>
                        <div class="form-group">
                            <label for="user-phone">Téléphone</label>
                            <input type="text" id="user-phone" class="form-control" maxlength="20">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="user-address">Adresse</label>
                        <textarea id="user-address" class="form-control" maxlength="500" rows="2"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="user-is-admin"> Administrateur
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="user-is-active" checked> Actif
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Ajouter l'utilisateur</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('users')">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        UI.setContent(html);

        // Setup form handler
        document.getElementById('add-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddUser();
        });
    },

    // Handle add user form submission
    handleAddUser: async function() {
        const userData = {
            full_name: document.getElementById('user-full-name').value.trim(),
            email: document.getElementById('user-email').value.trim(),
            password: document.getElementById('user-password').value,
            phone: document.getElementById('user-phone').value.trim() || null,
            address: document.getElementById('user-address').value.trim() || null,
            is_admin: document.getElementById('user-is-admin').checked,
            is_active: document.getElementById('user-is-active').checked
        };

        // Validation
        if (!userData.full_name || !userData.email || !userData.password) {
            UI.showMessage('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (userData.password.length < 8) {
            UI.showMessage('Le mot de passe doit contenir au moins 8 caractères', 'error');
            return;
        }

        try {
            await Api.createUser(userData);
            UI.showMessage('Utilisateur créé avec succès', 'success');
            this.loadPage('users');
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            UI.showMessage(error.message || 'Erreur lors de la création de l\'utilisateur', 'error');
        }
    },

    // Edit user
    editUser: async function(userId) {
        try {
            UI.showLoading();
            const user = await Api.getUser(userId);
            UI.hideLoading();
            
            this.showEditUserForm(user);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            UI.hideLoading();
            UI.showMessage('Erreur lors de la récupération de l\'utilisateur', 'error');
        }
    },

    // Show edit user form
    showEditUserForm: function(user) {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Modifier l'utilisateur</h2>
                <form id="edit-user-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-user-full-name">Nom complet *</label>
                            <input type="text" id="edit-user-full-name" class="form-control" required maxlength="100" value="${user.full_name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-user-email">Email *</label>
                            <input type="email" id="edit-user-email" class="form-control" required maxlength="255" value="${user.email || ''}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-user-phone">Téléphone</label>
                            <input type="text" id="edit-user-phone" class="form-control" maxlength="20" value="${user.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-address">Adresse</label>
                        <textarea id="edit-user-address" class="form-control" maxlength="500" rows="2">${user.address || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="edit-user-is-admin" ${user.is_admin ? 'checked' : ''}> Administrateur
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="edit-user-is-active" ${user.is_active ? 'checked' : ''}> Actif
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Modifier l'utilisateur</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('users')">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        UI.setContent(html);

        // Setup form handler
        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditUser(user.id);
        });
    },

    // Handle edit user form submission
    handleEditUser: async function(userId) {
        const userData = {
            full_name: document.getElementById('edit-user-full-name').value.trim(),
            phone: document.getElementById('edit-user-phone').value.trim() || null,
            address: document.getElementById('edit-user-address').value.trim() || null,
            is_admin: document.getElementById('edit-user-is-admin').checked,
            is_active: document.getElementById('edit-user-is-active').checked
        };

        // Validation
        if (!userData.full_name) {
            UI.showMessage('Le nom complet est requis', 'error');
            return;
        }

        try {
            await Api.updateUser(userId, userData);
            UI.showMessage('Utilisateur modifié avec succès', 'success');
            this.loadPage('users');
        } catch (error) {
            console.error('Erreur lors de la modification de l\'utilisateur:', error);
            UI.showMessage(error.message || 'Erreur lors de la modification de l\'utilisateur', 'error');
        }
    },

    // Delete user with confirmation
    deleteUser: async function(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }

        try {
            UI.showLoading();
            await Api.deleteUser(userId);
            UI.hideLoading();
            UI.showMessage('Utilisateur supprimé avec succès', 'success');
            this.loadPage('users');
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            UI.hideLoading();
            UI.showMessage(error.message || 'Erreur lors de la suppression de l\'utilisateur', 'error');
        }
    },

    // View user details
    viewUserDetails: async function(userId) {
        UI.showLoading();

        try {
            const user = await Api.getUser(userId);
            const initials = user.full_name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase();

            const html = `
                <div class="user-details">
                    <div class="user-details-header">
                        <div class="user-avatar-large">${initials}</div>
                        <div class="user-details-info">
                            <h2>${user.full_name}</h2>
                            <p class="user-email">${user.email}</p>
                            <p class="user-role">${user.is_admin ? 'Administrateur' : 'Utilisateur'}</p>
                        </div>
                    </div>
                    
                    <div class="user-details-content">
                        <div class="detail-section">
                            <h3>Informations personnelles</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Email:</strong> ${user.email}
                                </div>
                                <div class="detail-item">
                                    <strong>Téléphone:</strong> ${user.phone || 'Non spécifié'}
                                </div>
                                <div class="detail-item">
                                    <strong>Adresse:</strong> ${user.address || 'Non spécifiée'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Statut du compte</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Statut:</strong> 
                                    <span class="status ${user.is_active ? 'active' : 'inactive'}">
                                        ${user.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <strong>Rôle:</strong> ${user.is_admin ? 'Administrateur' : 'Utilisateur'}
                                </div>
                                <div class="detail-item">
                                    <strong>ID:</strong> ${user.id}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-details-actions">
                        <button class="btn" onclick="App.editUser(${user.id})">Modifier</button>
                        <button class="btn btn-secondary" onclick="App.loadPage('users')">Retour à la liste</button>
                    </div>
                </div>
            `;

            UI.hideLoading();
            UI.setContent(html);
        } catch (error) {
            console.error('Erreur lors du chargement des détails de l\'utilisateur:', error);
            UI.setContent(`
                <p>Erreur lors du chargement des détails de l'utilisateur. Veuillez réessayer.</p>
                <button class="btn mt-20" onclick="App.loadPage('users')">Retour à la liste</button>
            `);
        }
    },

    // =================== LOANS MANAGEMENT (ADMIN ONLY) ===================

    // Charge la page de gestion des emprunts
    loadLoansPage: async function() {
        UI.showLoading();
    
        try {
            const [loans, activeLoans, overdueLoans] = await Promise.all([
                Api.getLoans(),
                Api.getActiveLoans(),
                Api.getOverdueLoans()
            ]);
    
            let html = `
                <div class="loans-page">
                    <div class="loans-header">
                        <h2 class="mb-20">Gestion des Emprunts</h2>
                        <div class="loans-actions">
                            <button class="btn" id="search-loans-btn">Rechercher</button>
                        </div>
                    </div>
                    
                    <div class="search-section" id="loan-search-section" style="display: none;">
                        <div class="search-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <select id="search-loan-filter" class="form-control">
                                        <option value="all">Tous les emprunts</option>
                                        <option value="active">Emprunts actifs</option>
                                        <option value="overdue">Emprunts en retard</option>
                                        <option value="returned">Emprunts retournés</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <button class="btn" id="perform-loan-search-btn">Filtrer</button>
                                    <button class="btn" id="clear-loan-search-btn">Tout afficher</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="loans-stats mb-20">
                        <div class="stat-card">
                            <h3>Total</h3>
                            <p class="stat-number">${loans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>En Cours</h3>
                            <p class="stat-number">${activeLoans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>En Retard</h3>
                            <p class="stat-number stat-warning">${overdueLoans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Passés</h3>
                            <p class="stat-number">${loans.filter(l => l.return_date).length}</p>
                        </div>
                    </div>
                    
                    <div class="card-container" id="loans-container">
            `;

            if (loans.length === 0) {
                html += `<p>Aucun emprunt</p>`;
            } else {
                loans.forEach(loan => {
                    html += this.createLoanCard(loan);
                });
            }

            html += `</div></div>`;

            UI.setContent(html);
            
            // Setup event listeners
            this.setupLoansEventListeners();
            
        } catch (error) {
            console.error('Erreur lors du chargement des emprunts:', error);
            UI.setContent(`<p>Erreur lors du chargement des emprunts. Veuillez réessayer.</p>`);
        }
    },

    // Create a loan card HTML
    createLoanCard: function(loan) {
        const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && !loan.return_date;
        const isActive = !loan.return_date;
        const statusClass = isOverdue ? 'overdue' : isActive ? 'active' : 'returned';
        const statusText = isOverdue ? 'En retard' : isActive ? 'Actif' : 'Retourné';

        return `
            <div class="card loan-card" data-loan-id="${loan.id}">
                <div class="card-header">
                    <div class="loan-status">
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="loan-id">Emprunt #${loan.id}</div>
                </div>
                <div class="card-body">
                    <div class="loan-info">
                        <p><strong>Livre:</strong> ${loan.book?.title || 'N/A'}</p>
                        <p><strong>Emprunteur:</strong> ${loan.user?.full_name || 'N/A'}</p>
                        <p><strong>Email:</strong> ${loan.user?.email || 'N/A'}</p>
                        <p><strong>Date d'emprunt:</strong> ${new Date(loan.loan_date).toLocaleDateString()}</p>
                        <p><strong>Date d'échéance:</strong> ${new Date(loan.due_date).toLocaleDateString()}</p>
                        ${loan.return_date ? `<p><strong>Date de retour:</strong> ${new Date(loan.return_date).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="App.viewLoanDetails(${loan.id})">Voir détails</button>
                    ${isActive ? `
                        <button class="btn btn-success" onclick="App.returnLoan(${loan.id})">Marquer retourné</button>
                        <button class="btn btn-warning" onclick="App.extendLoan(${loan.id})">Prolonger</button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Setup event listeners for loans page
    setupLoansEventListeners: function() {
        // Add loan button
        const addLoanBtn = document.getElementById('add-loan-btn');
        if (addLoanBtn) {
            addLoanBtn.addEventListener('click', () => this.showAddLoanForm());
        }

        // Search toggle button
        const searchBtn = document.getElementById('search-loans-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleLoanSearchSection());
        }

        // Perform search button
        const performSearchBtn = document.getElementById('perform-loan-search-btn');
        if (performSearchBtn) {
            performSearchBtn.addEventListener('click', () => this.performLoanSearch());
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clear-loan-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearLoanSearch());
        }
    },

    // Toggle loan search section visibility
    toggleLoanSearchSection: function() {
        const searchSection = document.getElementById('loan-search-section');
        if (searchSection) {
            const isVisible = searchSection.style.display !== 'none';
            searchSection.style.display = isVisible ? 'none' : 'block';
            
            const searchBtn = document.getElementById('search-loans-btn');
            if (searchBtn) {
                searchBtn.textContent = isVisible ? 'Rechercher' : 'Masquer recherche';
            }
        }
    },

    // Perform loan search/filter
    performLoanSearch: async function() {
        const filter = document.getElementById('search-loan-filter')?.value;

        try {
            UI.showLoading();
            let loans = [];
            
            switch (filter) {
                case 'active':
                    loans = await Api.getActiveLoans();
                    break;
                case 'overdue':
                    loans = await Api.getOverdueLoans();
                    break;
                case 'returned':
                    const allLoans = await Api.getLoans();
                    loans = allLoans.filter(loan => loan.return_date);
                    break;
                default:
                    loans = await Api.getLoans();
            }
            
            this.displayLoanSearchResults(loans);
            UI.hideLoading();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            UI.showMessage('Erreur lors de la recherche', 'error');
            UI.hideLoading();
        }
    },

    // Clear loan search and reload all loans
    clearLoanSearch: function() {
        document.getElementById('search-loan-filter').value = 'all';
        this.loadLoansPage();
    },

    // Display loan search results
    displayLoanSearchResults: function(loans) {
        const container = document.getElementById('loans-container');
        if (!container) return;

        if (loans.length === 0) {
            container.innerHTML = '<p>Aucun emprunt trouvé pour ce filtre.</p>';
            return;
        }

        let html = '';
        loans.forEach(loan => {
            html += this.createLoanCard(loan);
        });
        
        container.innerHTML = html;
    },

    // Show add loan form
    showAddLoanForm: function() {
        const html = `
            <div class="form-container">
                <h2 class="text-center mb-20">Nouvel emprunt</h2>
                <form id="add-loan-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="loan-user-email">Email de l'utilisateur *</label>
                            <input type="email" id="loan-user-email" class="form-control" required placeholder="email@example.com">
                            <div id="user-info" class="user-preview" style="display: none;">
                                <p><strong>Utilisateur:</strong> <span id="preview-user-name"></span></p>
                            </div>
                        </div>
                        <div class="form-group">
                            <button type="button" id="search-user-btn" class="btn btn-secondary">Rechercher utilisateur</button>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="loan-book-isbn">ISBN du livre *</label>
                            <input type="text" id="loan-book-isbn" class="form-control" required placeholder="ISBN du livre">
                            <div id="book-info" class="book-preview" style="display: none;">
                                <p><strong>Livre:</strong> <span id="preview-book-title"></span></p>
                                <p><strong>Auteur:</strong> <span id="preview-book-author"></span></p>
                                <p><strong>Disponible:</strong> <span id="preview-book-quantity"></span> exemplaire(s)</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <button type="button" id="search-book-btn" class="btn btn-secondary">Rechercher livre</button>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="loan-period">Durée d'emprunt (jours) *</label>
                            <input type="number" id="loan-period" class="form-control" required min="1" max="90" value="14">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn" id="submit-loan-btn" disabled>Créer l'emprunt</button>
                        <button type="button" class="btn btn-secondary" onclick="App.loadPage('loans')">Annuler</button>
                    </div>
                </form>
            </div>
        `;

        UI.setContent(html);

        // Setup form handlers
        this.setupLoanFormHandlers();
    },

    // Setup loan form handlers
    setupLoanFormHandlers: function() {
        let selectedUser = null;
        let selectedBook = null;

        // Search user button
        document.getElementById('search-user-btn').addEventListener('click', async () => {
            const email = document.getElementById('loan-user-email').value.trim();
            if (!email) {
                UI.showMessage('Veuillez saisir un email', 'error');
                return;
            }

            try {
                UI.showLoading();
                const user = await Api.getUserByEmail(email);
                selectedUser = user;
                
                document.getElementById('preview-user-name').textContent = user.full_name;
                document.getElementById('user-info').style.display = 'block';
                
                this.updateSubmitButton(selectedUser, selectedBook);
                UI.hideLoading();
                UI.showMessage('Utilisateur trouvé', 'success');
            } catch (error) {
                selectedUser = null;
                document.getElementById('user-info').style.display = 'none';
                this.updateSubmitButton(selectedUser, selectedBook);
                UI.hideLoading();
                UI.showMessage('Utilisateur non trouvé', 'error');
            }
        });

        // Search book button
        document.getElementById('search-book-btn').addEventListener('click', async () => {
            const isbn = document.getElementById('loan-book-isbn').value.trim();
            if (!isbn) {
                UI.showMessage('Veuillez saisir un ISBN', 'error');
                return;
            }

            try {
                UI.showLoading();
                const book = await Api.searchBookByISBN(isbn);
                selectedBook = book;
                
                document.getElementById('preview-book-title').textContent = book.title;
                document.getElementById('preview-book-author').textContent = book.author;
                document.getElementById('preview-book-quantity').textContent = book.quantity;
                document.getElementById('book-info').style.display = 'block';
                
                if (book.quantity <= 0) {
                    UI.showMessage('Ce livre n\'est pas disponible (quantité: 0)', 'warning');
                }
                
                this.updateSubmitButton(selectedUser, selectedBook);
                UI.hideLoading();
                UI.showMessage('Livre trouvé', 'success');
            } catch (error) {
                selectedBook = null;
                document.getElementById('book-info').style.display = 'none';
                this.updateSubmitButton(selectedUser, selectedBook);
                UI.hideLoading();
                UI.showMessage('Livre non trouvé', 'error');
            }
        });

        // Form submission
        document.getElementById('add-loan-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!selectedUser || !selectedBook) {
                UI.showMessage('Veuillez rechercher et sélectionner un utilisateur et un livre', 'error');
                return;
            }

            if (selectedBook.quantity <= 0) {
                UI.showMessage('Ce livre n\'est pas disponible', 'error');
                return;
            }

            const loanPeriod = parseInt(document.getElementById('loan-period').value);

            try {
                await Api.createLoan(selectedUser.id, selectedBook.id, loanPeriod);
                UI.showMessage('Emprunt créé avec succès', 'success');
                this.loadPage('loans');
            } catch (error) {
                console.error('Erreur lors de la création de l\'emprunt:', error);
                UI.showMessage(error.message || 'Erreur lors de la création de l\'emprunt', 'error');
            }
        });
    },

    // Update submit button state
    updateSubmitButton: function(user, book) {
        const submitBtn = document.getElementById('submit-loan-btn');
        const canSubmit = user && book && book.quantity > 0;
        submitBtn.disabled = !canSubmit;
        submitBtn.textContent = canSubmit ? 'Créer l\'emprunt' : 'Rechercher utilisateur et livre';
    },

    // Return a loan
    returnLoan: async function(loanId) {
        if (!confirm('Marquer cet emprunt comme retourné ?')) {
            return;
        }

        try {
            UI.showLoading();
            await Api.returnLoan(loanId);
            UI.hideLoading();
            UI.showMessage('Emprunt marqué comme retourné', 'success');
            this.loadPage('loans');
        } catch (error) {
            console.error('Erreur lors du retour de l\'emprunt:', error);
            UI.hideLoading();
            UI.showMessage(error.message || 'Erreur lors du retour de l\'emprunt', 'error');
        }
    },

    // Extend a loan
    extendLoan: async function(loanId) {
        const days = prompt('Nombre de jours de prolongation:', '7');
        if (!days || isNaN(days) || parseInt(days) <= 0) {
            return;
        }

        try {
            UI.showLoading();
            await Api.extendLoan(loanId, parseInt(days));
            UI.hideLoading();
            UI.showMessage(`Emprunt prolongé de ${days} jours`, 'success');
            this.loadPage('loans');
        } catch (error) {
            console.error('Erreur lors de la prolongation de l\'emprunt:', error);
            UI.hideLoading();
            UI.showMessage(error.message || 'Erreur lors de la prolongation de l\'emprunt', 'error');
        }
    },

    // View a loan details
    viewLoanDetails: async function(loanId) {
        UI.showLoading();

        try {
            const loan = await Api.getLoan(loanId);
            const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && !loan.return_date;
            const isActive = !loan.return_date;
            const statusClass = isOverdue ? 'overdue' : isActive ? 'active' : 'returned';
            const statusText = isOverdue ? 'En retard' : isActive ? 'Actif' : 'Retourné';

            const html = `
                <div class="loan-details">
                    <div class="loan-details-header">
                        <h2>Détails de l'emprunt #${loan.id}</h2>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="loan-details-content">
                        <div class="detail-section">
                            <h3>Informations sur le livre</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Titre:</strong> ${loan.book?.title || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Auteur:</strong> ${loan.book?.author || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>ISBN:</strong> ${loan.book?.isbn || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Informations sur l'emprunteur</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Nom:</strong> ${loan.user?.full_name || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Email:</strong> ${loan.user?.email || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Téléphone:</strong> ${loan.user?.phone || 'Non spécifié'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Détails de l'emprunt</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Date d'emprunt:</strong> ${new Date(loan.loan_date).toLocaleDateString()}
                                </div>
                                <div class="detail-item">
                                    <strong>Date d'échéance:</strong> ${new Date(loan.due_date).toLocaleDateString()}
                                </div>
                                ${loan.return_date ? `
                                    <div class="detail-item">
                                        <strong>Date de retour:</strong> ${new Date(loan.return_date).toLocaleDateString()}
                                    </div>
                                ` : ''}
                                <div class="detail-item">
                                    <strong>ID Emprunt:</strong> ${loan.id}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="loan-details-actions">
                        ${isActive ? `
                            <button class="btn btn-success" onclick="App.returnLoan(${loan.id})">Marquer retourné</button>
                            <button class="btn btn-warning" onclick="App.extendLoan(${loan.id})">Prolonger</button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="App.loadPage('loans')">Retour à la liste</button>
                    </div>
                </div>
            `;

            UI.hideLoading();
            UI.setContent(html);
        } catch (error) {
            console.error('Erreur lors du chargement des détails de l\'emprunt:', error);
            UI.setContent(`
                <p>Erreur lors du chargement des détails de l'emprunt. Veuillez réessayer.</p>
                <button class="btn mt-20" onclick="App.loadPage('loans')">Retour à la liste</button>
            `);
        }
    },

    // =================== MY LOANS (USER) ===================

    // Charge la page des emprunts de l'utilisateur connecté
    loadMyLoansPage: async function() {
        UI.showLoading();

        try {
            const [myLoans, myActiveLoans, myOverdueLoans] = await Promise.all([
                Api.getMyLoans(),
                Api.getMyActiveLoans(),
                Api.getMyOverdueLoans()
            ]);

            const user = Auth.getUser();
            const currentDate = new Date();

            let html = `
                <div class="my-loans-page">
                    <div class="my-loans-header">
                        <h2 class="mb-20">Mes Emprunts</h2>
                        <p class="mb-20">Gérez vos emprunts de livres</p>
                    </div>
                    
                    <div class="loans-stats mb-20">
                        <div class="stat-card">
                            <h3>Total Emprunts</h3>
                            <p class="stat-number">${myLoans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Emprunts Actifs</h3>
                            <p class="stat-number">${myActiveLoans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>En Retard</h3>
                            <p class="stat-number stat-warning">${myOverdueLoans.length}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Retournés</h3>
                            <p class="stat-number">${myLoans.filter(l => l.return_date).length}</p>
                        </div>
                    </div>
                    
                    <div class="card-container" id="my-loans-container">
            `;

            if (myLoans.length === 0) {
                html += `
                    <div class="no-loans-message">
                        <img src="./images/no-loans.png" alt="Aucun emprunt" class="no-loans-image mb-20">
                        <h3>Aucun emprunt trouvé</h3>
                        <p>Vous n'avez pas encore emprunté de livres.</p>
                    </div>
                `;
            } else {
                myLoans.forEach(loan => {
                    html += this.createUserLoanCard(loan);
                });
            }

            html += `</div></div>`;

            UI.setContent(html);
            UI.hideLoading();
            
        } catch (error) {
            console.error('Erreur lors du chargement de mes emprunts:', error);
            UI.hideLoading();
            UI.setContent(`<p>Erreur lors du chargement de vos emprunts. Veuillez réessayer.</p>`);
        }
    },

    // Create a user loan card HTML (simplified version for users)
    createUserLoanCard: function(loan) {
        const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && !loan.return_date;
        const isActive = !loan.return_date;
        const statusClass = isOverdue ? 'overdue' : isActive ? 'active' : 'returned';
        const statusText = isOverdue ? 'En retard' : isActive ? 'Actif' : 'Retourné';
        
        // Calculate days until due or days overdue
        let dueDateInfo = '';
        if (isActive && loan.due_date) {
            const dueDate = new Date(loan.due_date);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                dueDateInfo = `<p class="due-info"><strong>À retourner dans:</strong> ${diffDays} jour(s)</p>`;
            } else if (diffDays === 0) {
                dueDateInfo = `<p class="due-info warning"><strong>À retourner aujourd'hui</strong></p>`;
            } else {
                dueDateInfo = `<p class="due-info overdue"><strong>En retard de:</strong> ${Math.abs(diffDays)} jour(s)</p>`;
            }
        }

        return `
            <div class="card loan-card user-loan-card" data-loan-id="${loan.id}">
                <div class="card-header">
                    <div class="loan-status">
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="loan-id">Emprunt #${loan.id}</div>
                </div>
                <div class="card-body">
                    <div class="loan-info">
                        <h4 class="book-title">${loan.book?.title || 'N/A'}</h4>
                        <p><strong>Auteur:</strong> ${loan.book?.author || 'N/A'}</p>
                        <p><strong>ISBN:</strong> ${loan.book?.isbn || 'N/A'}</p>
                        <p><strong>Date d'emprunt:</strong> ${new Date(loan.loan_date).toLocaleDateString()}</p>
                        <p><strong>Date d'échéance:</strong> ${new Date(loan.due_date).toLocaleDateString()}</p>
                        ${loan.return_date ? `<p><strong>Date de retour:</strong> ${new Date(loan.return_date).toLocaleDateString()}</p>` : ''}
                        ${dueDateInfo}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn" onclick="App.viewMyLoanDetails(${loan.id})">Voir détails</button>
                </div>
            </div>
        `;
    },

    // Setup event listeners for my loans page
    setupMyLoansEventListeners: function() {
        // Search toggle button
        const searchBtn = document.getElementById('search-my-loans-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleMyLoanSearchSection());
        }

        // Perform search button
        const performSearchBtn = document.getElementById('perform-my-loan-search-btn');
        if (performSearchBtn) {
            performSearchBtn.addEventListener('click', () => this.performMyLoanSearch());
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clear-my-loan-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearMyLoanSearch());
        }
    },

    // Toggle my loan search section visibility
    toggleMyLoanSearchSection: function() {
        const searchSection = document.getElementById('my-loan-search-section');
        if (searchSection) {
            const isVisible = searchSection.style.display !== 'none';
            searchSection.style.display = isVisible ? 'none' : 'block';
            
            const searchBtn = document.getElementById('search-my-loans-btn');
            if (searchBtn) {
                searchBtn.textContent = isVisible ? 'Filtrer mes emprunts' : 'Masquer filtres';
            }
        }
    },

    // Perform my loan search/filter
    performMyLoanSearch: async function() {
        const filter = document.getElementById('search-my-loan-filter')?.value;

        try {
            UI.showLoading();
            let loans = [];
            
            switch (filter) {
                case 'active':
                    loans = await Api.getMyActiveLoans();
                    break;
                case 'overdue':
                    loans = await Api.getMyOverdueLoans();
                    break;
                case 'returned':
                    const allLoans = await Api.getMyLoans();
                    loans = allLoans.filter(loan => loan.return_date);
                    break;
                default:
                    loans = await Api.getMyLoans();
            }
            
            this.displayMyLoanSearchResults(loans);
            UI.hideLoading();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            UI.showMessage('Erreur lors de la recherche', 'error');
            UI.hideLoading();
        }
    },

    // Clear my loan search and reload all loans
    clearMyLoanSearch: function() {
        document.getElementById('search-my-loan-filter').value = 'all';
        this.loadMyLoansPage();
    },

    // Display my loan search results
    displayMyLoanSearchResults: function(loans) {
        const container = document.getElementById('my-loans-container');
        if (!container) return;

        if (loans.length === 0) {
            container.innerHTML = '<p>Aucun emprunt trouvé pour ce filtre.</p>';
            return;
        }

        let html = '';
        loans.forEach(loan => {
            html += this.createUserLoanCard(loan);
        });
        
        container.innerHTML = html;
    },

    // View my loan details (simplified for users)
    viewMyLoanDetails: async function(loanId) {
        UI.showLoading();

        try {
            const loan = await Api.getLoan(loanId);
            const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && !loan.return_date;
            const isActive = !loan.return_date;
            const statusClass = isOverdue ? 'overdue' : isActive ? 'active' : 'returned';
            const statusText = isOverdue ? 'En retard' : isActive ? 'Actif' : 'Retourné';

            const html = `
                <div class="loan-details">
                    <div class="loan-details-header">
                        <h2>Détails de l'emprunt #${loan.id}</h2>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="loan-details-content">
                        <div class="detail-section">
                            <h3>Informations sur le livre</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Titre:</strong> ${loan.book?.title || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Auteur:</strong> ${loan.book?.author || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>ISBN:</strong> ${loan.book?.isbn || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Catégorie:</strong> ${loan.book?.category || 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Année:</strong> ${loan.book?.publication_year || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3>Détails de l'emprunt</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Date d'emprunt:</strong> ${new Date(loan.loan_date).toLocaleDateString()}
                                </div>
                                <div class="detail-item">
                                    <strong>Date d'échéance:</strong> ${new Date(loan.due_date).toLocaleDateString()}
                                </div>
                                ${loan.return_date ? `
                                    <div class="detail-item">
                                        <strong>Date de retour:</strong> ${new Date(loan.return_date).toLocaleDateString()}
                                    </div>
                                ` : ''}
                                <div class="detail-item">
                                    <strong>Prolongé:</strong> ${loan.extended ? 'Oui' : 'Non'}
                                </div>
                                <div class="detail-item">
                                    <strong>ID Emprunt:</strong> ${loan.id}
                                </div>
                            </div>
                        </div>
                        
                        ${isOverdue ? `
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>Attention:</strong> Cet emprunt est en retard. Veuillez contacter la bibliothèque.
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="loan-details-actions">
                        <button class="btn btn-secondary" onclick="App.loadPage('my-loans')">Retour à mes emprunts</button>
                    </div>
                </div>
            `;

            UI.hideLoading();
            UI.setContent(html);
        } catch (error) {
            console.error('Erreur lors du chargement des détails de l\'emprunt:', error);
            UI.hideLoading();
            UI.setContent(`
                <p>Erreur lors du chargement des détails de l'emprunt. Veuillez réessayer.</p>
                <button class="btn mt-20" onclick="App.loadPage('my-loans')">Retour à mes emprunts</button>
            `);
        }
    },

    // =================== DASHBOARD/STATISTICS PAGE (ADMIN ONLY) ===================

    // Load dashboard with statistics
    loadDashboardPage: async function() {
        const user = Auth.getUser();
        if (!user || !user.is_admin) {
            UI.showMessage('Accès non autorisé', 'error');
            this.loadPage('books');
            return;
        }
    
        UI.showLoading();
    
        try {
            const [generalStats, mostBorrowedBooks] = await Promise.all([
                Api.getGeneralStats(),
                Api.getMostBorrowedBooks(5)
            ]);
    
            let html = `
                <div class="dashboard-page">
                    <div class="dashboard-header">
                        <h2 class="mb-20">Tableau de Bord</h2>
                    </div>
    
                    <div class="dashboard-stats mb-30">
                        <div class="stat-card">
                            <h3>Total Livres</h3>
                            <p class="stat-number">${generalStats.total_books || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Total Utilisateurs</h3>
                            <p class="stat-number">${generalStats.total_users || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Emprunts Actifs</h3>
                            <p class="stat-number">${generalStats.active_loans || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Emprunts en Retard</h3>
                            <p class="stat-number stat-warning">${generalStats.overdue_loans || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Moy. Retours à Temps</h3>
                            <p class="stat-number">${generalStats.avg_ontime_returns || 0}%</p>
                        </div>
                        <div class="stat-card">
                            <h3>Moy. Retours en Retard</h3>
                            <p class="stat-number">${generalStats.avg_late_returns || 0}%</p>
                        </div>
                        <div class="stat-card">
                            <h3>Moy. Emprunts/Utilisateur</h3>
                            <p class="stat-number">${generalStats.avg_loans_per_user || 0}</p>
                        </div>
                    </div>
                </div>
            `;
    
            UI.setContent(html);
            UI.hideLoading();
    
        } catch (error) {
            console.error('Error loading dashboard:', error);
            UI.hideLoading();
            UI.showMessage('Erreur lors du chargement du tableau de bord', 'error');
        }
    }
};

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});