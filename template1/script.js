
const firebaseConfig = {
    apiKey: "AIzaSyDZ-6kvrXo0BmeCWhj0_fWxMC_G27AXut8",
    authDomain: "rgtube-fccfd.firebaseapp.com",
    databaseURL: "https://rgtube-fccfd-default-rtdb.firebaseio.com",
    projectId: "rgtube-fccfd",
    storageBucket: "rgtube-fccfd.firebasestorage.app",
    messagingSenderId: "1066400212988",
    appId: "1:1066400212988:web:8f33940fe7e945e87e3479",
    measurementId: "G-D57TFV9QFE"
};


let auth, database;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}


let videos = [
    {
        id: 'demo1',
        title: "Building a Modern YouTube Clone with HTML & CSS",
        channel: "RG Dev",
        channelInitial: "R",
        views: "1.2M",
        uploadTime: "2 days ago",
        duration: "15:32",
        category: "coding",
        thumbnail: "https://picsum.photos/seed/video1/640/360",
        uploaderId: "demo",
        description: "Learn how to build a complete YouTube clone from scratch using HTML and CSS."
    },
    {
        id: 'demo2',
        title: "Top 10 Gaming Moments of 2024",
        channel: "Gaming Hub",
        channelInitial: "G",
        views: "856K",
        uploadTime: "1 week ago",
        duration: "22:15",
        category: "gaming",
        thumbnail: "https://picsum.photos/seed/video2/640/360",
        uploaderId: "demo",
        description: "The most exciting gaming moments captured this year."
    },
    {
        id: 'demo3',
        title: "Relaxing Piano Music for Study and Work",
        channel: "Music Therapy",
        channelInitial: "M",
        views: "2.3M",
        uploadTime: "3 weeks ago",
        duration: "3:00:00",
        category: "music",
        thumbnail: "https://picsum.photos/seed/video3/640/360",
        uploaderId: "demo",
        description: "Beautiful piano compositions to help you focus and relax."
    },
    {
        id: 'demo4',
        title: "JavaScript Tutorial for Beginners",
        channel: "Code Academy",
        channelInitial: "C",
        views: "3.1M",
        uploadTime: "1 month ago",
        duration: "4:30:00",
        category: "coding",
        thumbnail: "https://picsum.photos/seed/video4/640/360",
        uploaderId: "demo",
        description: "Complete JavaScript course for beginners."
    }
];


let currentUser = null;
let userData = {
    watchLater: [],
    likedVideos: [],
    history: [],
    notifications: []
};


let currentPlayingVideo = null;


let elements = {};


document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    renderVideos(videos);
    setupEventListeners();
    checkAuthState();
    loadUserData();
});


function initializeElements() {
    elements.videoGrid = document.getElementById('videoGrid');
    elements.menuToggle = document.getElementById('menuToggle');
    elements.sidebar = document.getElementById('sidebar');
    elements.mainContent = document.getElementById('mainContent');
    elements.searchInput = document.getElementById('searchInput');
    elements.userAvatar = document.getElementById('userAvatar');
    elements.profileDropdown = document.getElementById('profileDropdown');
    elements.authModal = document.getElementById('authModal');
    elements.uploadModal = document.getElementById('uploadModal');
    elements.notificationsPanel = document.getElementById('notificationsPanel');
    elements.videoPlayerModal = document.getElementById('videoPlayerModal');
    elements.toastContainer = document.getElementById('toastContainer');
}


function setupEventListeners() {
 
    elements.menuToggle.addEventListener('click', toggleSidebar);
    
    
    document.querySelectorAll('.category-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterByCategory(this.dataset.category);
        });
    });
    
   
    document.getElementById('scrollLeft').addEventListener('click', function() {
        document.getElementById('categoriesContainer').scrollBy({ left: -200, behavior: 'smooth' });
    });
    
    document.getElementById('scrollRight').addEventListener('click', function() {
        document.getElementById('categoriesContainer').scrollBy({ left: 200, behavior: 'smooth' });
    });
    
    // Search
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Close modals on background click
    window.addEventListener('click', function(e) {
        if (e.target === elements.authModal) {
            closeAuthModal();
        }
        if (e.target === elements.uploadModal) {
            closeUploadModal();
        }
        if (e.target === elements.videoPlayerModal) {
            closeVideoPlayer();
        }
    });
    
    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-avatar') && !e.target.closest('.profile-dropdown')) {
            elements.profileDropdown.classList.remove('show');
        }
        if (!e.target.closest('.notification-icon') && !e.target.closest('.notifications-panel')) {
            elements.notificationsPanel.classList.remove('show');
        }
    });
    
  
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--accent-blue)';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            var files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('video/')) {
                handleFileSelect({ target: { files: files } });
            }
        });
    }
    
  
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            elements.searchInput.focus();
        }
        if (e.key === 'Escape') {
            closeAuthModal();
            closeUploadModal();
            closeVideoPlayer();
            elements.profileDropdown.classList.remove('show');
            elements.notificationsPanel.classList.remove('show');
        }
    });
    
  
    window.addEventListener('resize', handleWindowResize);
}


function navigateTo(section) {
 
    document.querySelectorAll('.view-section').forEach(function(view) {
        view.style.display = 'none';
    });
    
  
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    
    var viewMap = {
        'home': { view: 'homeView', item: '.sidebar-item i.fa-home' },
        'shorts': { view: 'shortsView', item: '.sidebar-item i.fa-bolt' },
        'subscriptions': { view: 'subscriptionsView', item: '.sidebar-item i.fa-play-circle' },
        'channel': { view: 'channelView', item: '.sidebar-item i.fa-user' },
        'history': { view: 'historyView', item: '.sidebar-item i.fa-history' },
        'watchlater': { view: 'watchLaterView', item: '.sidebar-item i.fa-clock-o' },
        'liked': { view: 'likedView', item: '.sidebar-item i.fa-thumbs-up' },
        'playlist': { view: 'playlistView', item: '.sidebar-item i.fa-list' },
        'settings': { view: 'settingsView', item: '.sidebar-item i.fa-cog' },
        'studio': { view: 'studioView', item: '.profile-item i.fa-video-camera' },
        'privacy': { view: 'privacyView', item: '.sidebar-item i.fa-shield' },
        'help': { view: 'helpView', item: '.sidebar-item i.fa-question-circle' },
        'feedback': { view: 'feedbackView', item: '.sidebar-item i.fa-comment' }
    };
    
    var target = viewMap[section];
    if (target) {
        var viewElement = document.getElementById(target.view);
        if (viewElement) {
            viewElement.style.display = 'block';
        }
        
        
        var activeItem = document.querySelector(target.item);
        if (activeItem) {
            activeItem.closest('.sidebar-item').classList.add('active');
        }
        
        
        switch(section) {
            case 'channel':
                loadChannelContent();
                break;
            case 'history':
                loadHistoryContent();
                break;
            case 'watchlater':
                loadWatchLaterContent();
                break;
            case 'liked':
                loadLikedContent();
                break;
        }
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        elements.sidebar.classList.remove('open');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function filterByCategory(category) {
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Navigate to home first
    navigateTo('home');
    
    // Filter videos
    if (category === 'all') {
        renderVideos(videos);
    } else if (category === 'trending') {
        renderVideos(videos.slice().sort(function(a, b) {
            return parseFloat(b.views.replace(/[^0-9.]/g, '')) - parseFloat(a.views.replace(/[^0-9.]/g, ''));
        }));
    } else {
        var filtered = videos.filter(function(v) {
            return v.category === category;
        });
        renderVideos(filtered);
    }
}

// Sidebar Functions
function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
    elements.sidebar.classList.toggle('open');
    elements.mainContent.classList.toggle('expanded');
}

// Render Videos
function renderVideos(videoList, containerId) {
    var container = containerId ? document.getElementById(containerId) : elements.videoGrid;
    if (!container) return;
    
    container.innerHTML = '';
    
    if (videoList.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-film"></i><h3>No videos found</h3><p>Try a different search or category</p></div>';
        return;
    }
    
    videoList.forEach(function(video) {
        var card = createVideoCard(video);
        container.appendChild(card);
    });
}

function createVideoCard(video) {
    var card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.id = video.id;
    
    card.innerHTML = '<div class="thumbnail-container">' +
        '<img src="' + video.thumbnail + '" alt="' + video.title + '" class="thumbnail">' +
        '<span class="thumbnail-overlay">' + video.duration + '</span>' +
        '</div>' +
        '<div class="video-info">' +
        '<div class="channel-avatar">' + video.channelInitial + '</div>' +
        '<div class="video-details">' +
        '<h3 class="video-title">' + video.title + '</h3>' +
        '<p class="channel-name">' + video.channel + '</p>' +
        '<p class="video-meta">' + video.views + ' views - ' + video.uploadTime + '</p>' +
        '</div></div>';
    
    card.addEventListener('click', function() {
        playVideo(video);
    });
    
    return card;
}

// Video Player
function playVideo(video) {
    currentPlayingVideo = video;
    
    // Add to history if logged in
    if (currentUser) {
        addToHistory(video);
    }
    
    // Update player UI
    document.getElementById('playerVideoTitle').textContent = video.title;
    document.getElementById('playerVideoViews').textContent = video.views + ' views';
    document.getElementById('playerVideoDate').textContent = 'Posted ' + video.uploadTime;
    document.getElementById('playerChannelName').textContent = video.channel;
    document.getElementById('playerChannelAvatar').textContent = video.channelInitial;
    document.getElementById('playerVideoDescription').textContent = video.description || 'No description available.';
    
    var player = document.getElementById('videoPlayer');
    player.src = video.videoData || '';
    player.poster = video.thumbnail;
    
    elements.videoPlayerModal.classList.add('show');
    player.play().catch(function(e) {
        console.log('Auto-play prevented:', e);
    });
}

function closeVideoPlayer() {
    elements.videoPlayerModal.classList.remove('show');
    var player = document.getElementById('videoPlayer');
    player.pause();
    player.src = '';
}

function likeVideo() {
    if (!currentUser) {
        showAuthModal('signin');
        return;
    }
    
    if (currentPlayingVideo) {
        addToLiked(currentPlayingVideo);
        showToast('Added to liked videos', 'success');
    }
}

function shareVideo() {
    if (currentPlayingVideo) {
        var url = window.location.href + '?v=' + currentPlayingVideo.id;
        if (navigator.share) {
            navigator.share({
                title: currentPlayingVideo.title,
                text: 'Check out this video!',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard', 'success');
        }
    }
}

function addToWatchLater() {
    if (!currentUser) {
        showAuthModal('signin');
        return;
    }
    
    if (currentPlayingVideo) {
        addToWatchLaterList(currentPlayingVideo);
        showToast('Added to Watch Later', 'success');
    }
}

// Search Functions
function performSearch() {
    var query = elements.searchInput.value.toLowerCase().trim();
    
    if (!query) {
        renderVideos(videos);
        return;
    }
    
    var results = videos.filter(function(video) {
        return video.title.toLowerCase().includes(query) || 
               video.channel.toLowerCase().includes(query) ||
               (video.description && video.description.toLowerCase().includes(query));
    });
    
    renderVideos(results);
    
    // Reset category buttons
    document.querySelectorAll('.category-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.querySelector('[data-category="all"]').classList.add('active');
}

// Auth Functions
function handleUserAvatarClick() {
    if (currentUser) {
        elements.profileDropdown.classList.toggle('show');
    } else {
        showAuthModal('signin');
    }
}

function showAuthModal(tab) {
    tab = tab || 'signin';
    elements.authModal.classList.add('show');
    
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(function(t) {
        t.classList.remove('active');
        if (t.dataset.tab === tab) {
            t.classList.add('active');
        }
    });
    
    // Show/hide forms
    document.getElementById('signinForm').classList.toggle('active', tab === 'signin');
    document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
}

function switchAuthTab(tab) {
    showAuthModal(tab);
}

function closeAuthModal() {
    elements.authModal.classList.remove('show');
}

function handleSignIn(e) {
    e.preventDefault();
    var email = document.getElementById('signinEmail').value;
    var password = document.getElementById('signinPassword').value;
    
    signInUser(email, password);
}

function handleSignUp(e) {
    e.preventDefault();
    var name = document.getElementById('signupName').value;
    var email = document.getElementById('signupEmail').value;
    var password = document.getElementById('signupPassword').value;
    
    signUpUser(name, email, password);
}

function signInUser(email, password) {
    var errorEl = document.getElementById('signinError');
    errorEl.textContent = '';
    
    if (auth) {
        auth.signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                showToast('Sign in successful!', 'success');
                closeAuthModal();
                document.getElementById('signinForm').reset();
            })
            .catch(function(error) {
                console.error('Sign in error:', error);
                errorEl.textContent = getAuthErrorMessage(error.code);
            });
    } else {
        // Demo mode
        currentUser = { 
            uid: 'demo_' + Date.now(),
            email: email, 
            displayName: email.split('@')[0] 
        };
        updateUIForLoggedInUser();
        showToast('Demo mode: Signed in successfully!', 'success');
        closeAuthModal();
        document.getElementById('signinForm').reset();
        saveUserData();
    }
}

function signUpUser(name, email, password) {
    var errorEl = document.getElementById('signupError');
    errorEl.textContent = '';
    
    if (auth) {
        auth.createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                return userCredential.user.updateProfile({ displayName: name });
            })
            .then(function() {
                showToast('Account created successfully!', 'success');
                closeAuthModal();
                document.getElementById('signupForm').reset();
            })
            .catch(function(error) {
                console.error('Sign up error:', error);
                errorEl.textContent = getAuthErrorMessage(error.code);
            });
    } else {
        // Demo mode
        currentUser = { 
            uid: 'demo_' + Date.now(),
            email: email, 
            displayName: name 
        };
        updateUIForLoggedInUser();
        showToast('Demo mode: Account created!', 'success');
        closeAuthModal();
        document.getElementById('signupForm').reset();
        saveUserData();
    }
}

function handleSignOut() {
    if (auth) {
        auth.signOut()
            .then(function() {
                showToast('Signed out successfully', 'info');
            })
            .catch(function(error) {
                console.error('Sign out error:', error);
            });
    } else {
        currentUser = null;
        userData = { watchLater: [], likedVideos: [], history: [], notifications: [] };
        updateUIForLoggedOutUser();
        showToast('Signed out successfully', 'info');
    }
    closeProfileDropdown();
}

function checkAuthState() {
    if (auth) {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                currentUser = user;
                updateUIForLoggedInUser();
                loadUserData();
            } else {
                currentUser = null;
                updateUIForLoggedOutUser();
            }
        });
    }
}

function updateUIForLoggedInUser() {
    var initial = currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U';
    elements.userAvatar.textContent = initial;
    elements.userAvatar.style.background = 'linear-gradient(45deg, var(--accent-red), #ff6b6b)';
    
    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('profileName').textContent = currentUser.displayName || 'User';
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileUid').textContent = 'UID: ' + currentUser.uid.substring(0, 8) + '...';
}

function updateUIForLoggedOutUser() {
    elements.userAvatar.textContent = 'R';
    elements.userAvatar.style.background = '#9c27b0';
}

function getAuthErrorMessage(code) {
    var messages = {
        'auth/email-already-in-use': 'Email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Please try again later'
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// Profile Dropdown
function closeProfileDropdown() {
    elements.profileDropdown.classList.remove('show');
}

// Upload Functions
function handleCreateClick() {
    if (currentUser) {
        showUploadModal();
    } else {
        showAuthModal('signin');
        showToast('Please sign in to upload videos', 'info');
    }
}

function showUploadModal() {
    elements.uploadModal.classList.add('show');
    resetUploadForm();
}

function closeUploadModal() {
    elements.uploadModal.classList.remove('show');
    resetUploadForm();
}

function resetUploadForm() {
    document.getElementById('uploadForm').reset();
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('uploadInfo').innerHTML = '';
    document.getElementById('uploadProgress').textContent = '';
    document.getElementById('uploadSubmitBtn').disabled = false;
    document.getElementById('uploadSubmitBtn').textContent = 'Upload to Database';
}

function handleFileSelect(e) {
    var file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('video/')) {
            showToast('Please select a valid video file', 'error');
            return;
        }
        
        // Display file info
        var fileSize = formatFileSize(file.size);
        document.getElementById('uploadInfo').innerHTML = '<div class="file-name">' + file.name + '</div><div class="file-size">' + fileSize + '</div>';
        
        // Create preview
        if (file.type.startsWith('video/')) {
            var url = URL.createObjectURL(file);
            document.getElementById('uploadPreview').innerHTML = '<video src="' + url + '" controls style="width: 100%; max-height: 200px; object-fit: contain;"></video>';
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleUpload(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAuthModal('signin');
        return;
    }
    
    var fileInput = document.getElementById('videoFile');
    var file = fileInput.files[0];
    var title = document.getElementById('videoTitle').value.trim();
    var description = document.getElementById('videoDescription').value.trim();
    var category = document.getElementById('videoCategory').value;
    
    if (!file) {
        showToast('Please select a video file', 'error');
        return;
    }
    
    if (!title) {
        showToast('Please enter a video title', 'error');
        return;
    }
    
    // Check file size (limit to ~50MB for base64 storage)
    if (file.size > 50 * 1024 * 1024) {
        showToast('File too large. Maximum size is 50MB for database storage.', 'error');
        return;
    }
    
    var submitBtn = document.getElementById('uploadSubmitBtn');
    var progressEl = document.getElementById('uploadProgress');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Converting...';
    progressEl.textContent = 'Reading file as base64...';
    
    // Read file as base64
    var reader = new FileReader();
    reader.onload = function(event) {
        var base64Data = event.target.result;
        
        progressEl.textContent = 'Saving to database...';
        
        // Create video object
        var videoData = {
            title: title,
            description: description,
            category: category,
            channel: currentUser.displayName || 'User',
            channelInitial: (currentUser.displayName || 'U').charAt(0).toUpperCase(),
            views: '0',
            uploadTime: 'Just now',
            duration: '0:00',
            thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect fill="%23ff0000" width="640" height="360"/><text fill="white" x="320" y="180" text-anchor="middle" font-size="48">' + title.substring(0, 10) + '</text></svg>',
            videoData: base64Data,
            uploaderId: currentUser.uid,
            uploaderEmail: currentUser.email,
            createdAt: database ? database.ServerValue.TIMESTAMP : Date.now(),
            isPublic: document.getElementById('videoPublic').checked,
            allowComments: document.getElementById('videoComments').checked
        };
        
        if (database) {
            // Save to Firebase Realtime Database
            var newVideoRef = database.ref('videos').push();
            videoData.id = newVideoRef.key;
            newVideoRef.set(videoData)
                .then(function() {
                    showToast('Video uploaded successfully!', 'success');
                    closeUploadModal();
                    // Add to local videos
                    videoData.id = newVideoRef.key;
                    videos.unshift(videoData);
                    renderVideos(videos);
                })
                .catch(function(error) {
                    console.error('Upload error:', error);
                    showToast('Upload failed: ' + error.message, 'error');
                })
                .then(function() {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload to Database';
                });
        } else {
            // Demo mode - save locally
            videoData.id = 'local_' + Date.now();
            videos.unshift(videoData);
            renderVideos(videos);
            showToast('Demo: Video uploaded successfully!', 'success');
            closeUploadModal();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload to Database';
        }
    };
    
    reader.onerror = function() {
        showToast('Error reading file', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload to Database';
    };
    
    reader.readAsDataURL(file);
}

// User Data Management
function loadUserData() {
    if (currentUser && database) {
        database.ref('users/' + currentUser.uid).once('value')
            .then(function(snapshot) {
                var data = snapshot.val();
                if (data) {
                    userData = data;
                }
            })
            .catch(function(error) {
                console.error('Error loading user data:', error);
            });
    }
}

function saveUserData() {
    if (currentUser && database) {
        database.ref('users/' + currentUser.uid).set(userData)
            .catch(function(error) {
                console.error('Error saving user data:', error);
            });
    }
}

function addToWatchLaterList(video) {
    var exists = userData.watchLater.some(function(v) { return v.id === video.id; });
    if (!exists) {
        userData.watchLater.unshift({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            channel: video.channel,
            channelInitial: video.channelInitial,
            duration: video.duration,
            views: video.views,
            uploadTime: video.uploadTime,
            addedAt: Date.now()
        });
        saveUserData();
    }
}

function addToHistory(video) {
    // Remove if already exists
    userData.history = userData.history.filter(function(v) { return v.id !== video.id; });
    // Add to front
    userData.history.unshift({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel,
        channelInitial: video.channelInitial,
        duration: video.duration,
        views: video.views,
        uploadTime: video.uploadTime,
        watchedAt: Date.now()
    });
    // Keep only last 100
    if (userData.history.length > 100) {
        userData.history = userData.history.slice(0, 100);
    }
    saveUserData();
}

function addToLiked(video) {
    var exists = userData.likedVideos.some(function(v) { return v.id === video.id; });
    if (!exists) {
        userData.likedVideos.unshift({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            channel: video.channel,
            channelInitial: video.channelInitial,
            duration: video.duration,
            views: video.views,
            uploadTime: video.uploadTime,
            likedAt: Date.now()
        });
        saveUserData();
    }
}

// Content Loading Functions
function loadChannelContent() {
    var container = document.getElementById('channelVideos');
    if (!container) return;
    
    // Update channel info
    if (currentUser) {
        document.getElementById('channelName').textContent = currentUser.displayName || 'Your Channel';
        document.getElementById('channelAvatar').textContent = (currentUser.displayName || 'U').charAt(0).toUpperCase();
    }
    
    // Get user's videos
    var userVideos = videos.filter(function(v) { 
        return currentUser && (v.uploaderId === currentUser.uid || v.uploaderEmail === currentUser.email); 
    });
    
    if (userVideos.length > 0) {
        renderVideos(userVideos, 'channelVideos');
    } else {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-video-camera"></i><h3>No videos yet</h3><p>Upload your first video to get started</p><button class="btn" onclick="handleCreateClick()">Upload Video</button></div>';
    }
}

function loadHistoryContent() {
    var container = document.getElementById('historyList');
    if (!container) return;
    
    if (userData.history.length > 0) {
        container.innerHTML = '';
        userData.history.forEach(function(item) {
            var div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = '<img src="' + item.thumbnail + '" class="history-thumbnail" onclick="playVideoById(\'' + item.id + '\')"><div class="history-info"><h3>' + item.title + '</h3><p>' + item.channel + ' - ' + item.views + ' views - ' + item.uploadTime + '</p></div>';
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-history"></i><h3>No watch history</h3><p>Videos you watch will appear here</p></div>';
    }
}

function loadWatchLaterContent() {
    var container = document.getElementById('watchLaterGrid');
    if (!container) return;
    
    if (userData.watchLater.length > 0) {
        renderVideos(userData.watchLater, 'watchLaterGrid');
    } else {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-clock-o"></i><h3>No videos in Watch Later</h3><p>Save videos to watch later by clicking the clock icon</p></div>';
    }
}

function loadLikedContent() {
    var container = document.getElementById('likedGrid');
    if (!container) return;
    
    if (userData.likedVideos.length > 0) {
        renderVideos(userData.likedVideos, 'likedGrid');
    } else {
        container.innerHTML = '<div class="empty-state"><i class="fa fa-thumbs-up"></i><h3>No liked videos</h3><p>Videos you like will appear here</p></div>';
    }
}

function playVideoById(id) {
    var video = videos.find(function(v) { return v.id === id; });
    if (video) {
        playVideo(video);
    }
}

// Notifications
function showNotifications() {
    loadNotifications();
    elements.notificationsPanel.classList.toggle('show');
}

function loadNotifications() {
    var container = document.getElementById('notificationsList');
    if (!container) return;
    
    if (userData.notifications.length > 0) {
        container.innerHTML = '';
        userData.notifications.forEach(function(notif) {
            var div = document.createElement('div');
            div.className = 'notification-item' + (notif.read ? '' : ' unread');
            div.innerHTML = '<img src="' + notif.thumbnail + '" class="notification-thumb"><div class="notification-content"><h4>' + notif.title + '</h4><p>' + notif.message + '</p></div>';
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p class="no-notifications">No notifications yet</p>';
    }
}

function markAllRead() {
    userData.notifications.forEach(function(n) { n.read = true; });
    saveUserData();
    loadNotifications();
}

// Utility Functions
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function handleWindowResize() {
    var width = window.innerWidth;
    
    if (width <= 1024) {
        elements.sidebar.classList.add('collapsed');
        elements.sidebar.classList.remove('open');
    } else {
        elements.sidebar.classList.remove('collapsed');
        elements.sidebar.classList.remove('open');
    }
}

// Global functions for HTML onclick handlers
window.navigateTo = navigateTo;
window.filterByCategory = filterByCategory;
window.handleCreateClick = handleCreateClick;
window.handleUserAvatarClick = handleUserAvatarClick;
window.showAuthModal = showAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleSignOut = handleSignOut;
window.handleUpload = handleUpload;
window.handleFileSelect = handleFileSelect;
window.closeAuthModal = closeAuthModal;
window.closeUploadModal = closeUploadModal;
window.closeProfileDropdown = closeProfileDropdown;
window.closeVideoPlayer = closeVideoPlayer;
window.playVideo = playVideo;
window.likeVideo = likeVideo;
window.shareVideo = shareVideo;
window.addToWatchLater = addToWatchLater;
window.showNotifications = showNotifications;
window.markAllRead = markAllRead;
window.performSearch = performSearch;
window.playVideoById = playVideoById;
