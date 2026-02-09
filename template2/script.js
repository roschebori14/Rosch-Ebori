
const projectsData = [
    {
        id: 1,
        title: "E-Commerce Platform",
        description: "A full-featured e-commerce platform with payment integration and inventory management.",
        category: "web",
        tags: ["React", "Node.js", "MongoDB", "Stripe"]
    },
    {
        id: 2,
        title: "Task Management App",
        description: "Collaborative task management application with real-time updates and notifications.",
        category: "web",
        tags: ["Vue.js", "Firebase", "Tailwind CSS"]
    },
    {
        id: 3,
        title: "Mobile Fitness Tracker",
        description: "Native mobile app for tracking workouts and health metrics with data visualization.",
        category: "mobile",
        tags: ["React Native", "Redux", "Firebase"]
    },
    {
        id: 4,
        title: "UI/UX Design System",
        description: "Comprehensive design system with components and guidelines for web applications.",
        category: "design",
        tags: ["Figma", "Design System", "Prototyping"]
    },
    {
        id: 5,
        title: "Analytics Dashboard",
        description: "Interactive analytics dashboard with real-time data visualization and reporting.",
        category: "web",
        tags: ["React", "D3.js", "PostgreSQL"]
    },
    {
        id: 6,
        title: "Social Media App",
        description: "Full-stack social media application with messaging, notifications, and media sharing.",
        category: "web",
        tags: ["MERN Stack", "Socket.io", "AWS S3"]
    }
];


const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const projectsGrid = document.getElementById('projectsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const navLinks = document.querySelectorAll('.nav-link');

let currentFilter = 'all';


document.addEventListener('DOMContentLoaded', () => {
    renderProjects('all');
    setupEventListeners();
});


function setupEventListeners() {
    
    hamburger.addEventListener('click', toggleMobileMenu);
    
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderProjects(currentFilter);
        });
    });

    
    contactForm.addEventListener('submit', handleFormSubmit);

    
    setupSmoothScroll();

    
    setupScrollAnimation();
}


function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}


function renderProjects(filter) {
    projectsGrid.innerHTML = '';
    
    const filteredProjects = filter === 'all' 
        ? projectsData 
        : projectsData.filter(project => project.category === filter);

    filteredProjects.forEach((project, index) => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
        
        
        setTimeout(() => {
            projectCard.style.animation = `slideUp 0.6s ease-out ${index * 0.1}s forwards`;
            projectCard.style.opacity = '0';
            projectCard.style.animation = `slideUp 0.6s ease-out ${index * 0.1}s forwards`;
        }, 0);
    });
}


function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-image">
            <i class="fas fa-project-diagram"></i>
        </div>
        <div class="project-info">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tags">
                ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showToast(`Viewing: ${project.title}`, 'success');
    });
    
    return card;
}


function handleFormSubmit(e) {
    e.preventDefault();
    
    
    const formData = new FormData(contactForm);
    const name = contactForm.querySelector('input[type="text"]').value;
    const email = contactForm.querySelector('input[type="email"]').value;
    const message = contactForm.querySelector('textarea').value;

    
    if (!name.trim() || !email.trim() || !message.trim()) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        
        showToast('Message sent successfully! I will get back to you soon.', 'success');
        contactForm.reset();
    }, 1500);
}


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


function setupSmoothScroll() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}


function setupScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    
    document.querySelectorAll('.about, .projects, .skills, .contact, .services').forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
});


window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 250) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


window.addEventListener('scroll', debounce(() => {
    
}, 50), { passive: true });


document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
    });
});


document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        
    } else {
        
    }
});


window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});


const backToTopButton = document.getElementById('backToTop');

if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        showToast('Back to top!', 'success');
    });
}
