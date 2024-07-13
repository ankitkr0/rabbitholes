document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('exploreForm');
    const resultsDiv = document.getElementById('results');
    const loaderDiv = document.getElementById('loader');
    const loaderMessages = document.getElementById('loaderMessages');
    const contentResults = document.getElementById('contentResults');
    const suggestions = document.querySelectorAll('.topic-suggestion');
    const topicInput = document.getElementById('topic');
    const themeToggle = document.getElementById('themeToggle');

    // Theme toggle functionality
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }

    function getTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return prefersDarkScheme.matches ? 'dark' : 'light';
    }

    // Set initial theme
    setTheme(getTheme());

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        const currentTheme = getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Listen for system theme changes
    prefersDarkScheme.addListener((e) => {
        setTheme(e.matches ? 'dark' : 'light');
    });

    const loaderTexts = [
        "Scanning personal blogs for insights...",
        "Exploring YouTube for informative videos...",
        "Diving into Substack articles...",
        "Searching Hacker News for tech discussions...",
        "Finding relevant podcast episodes...",
        "Exploring Reddit for community discussions..."
    ];

    const platformIcons = {
        blogs: '<i class="fas fa-blog"></i>',
        youtube: '<i class="fab fa-youtube"></i>',
        substack: '<i class="fas fa-newspaper"></i>',
        hacker_news: '<i class="fab fa-hacker-news"></i>',
        podcasts: '<i class="fas fa-podcast"></i>',
        reddit: '<i class="fab fa-reddit"></i>'
    };

    function showLoader() {
        resultsDiv.classList.remove('hidden');
        loaderDiv.classList.remove('hidden');
        contentResults.innerHTML = '';
        loaderMessages.innerHTML = '';
        loaderTexts.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            loaderMessages.appendChild(li);
        });
    }

    function hideLoader() {
        loaderDiv.classList.add('hidden');
    }

    function extractUrl(text) {
        if (typeof text !== 'string' || text.trim() === '') {
            return null;
        }

        // Check if the text is already a valid URL
        if (/^(http|https):\/\/[^ "]+$/.test(text)) {
            return text.replace(/[^\w\s-./:]+$/, ''); // Remove any trailing non-alphanumeric characters
        }

        // Try to extract URL from Markdown format: [title](url)
        const markdownMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (markdownMatch && markdownMatch[2]) {
            return markdownMatch[2].replace(/[^\w\s-./:]+$/, ''); // Remove any trailing non-alphanumeric characters
        }

        // Try to find any URL in the text
        const urlMatch = text.match(/\bhttps?:\/\/\S+/gi);
        if (urlMatch) {
            return urlMatch[0].replace(/[^\w\s-./:]+$/, ''); // Remove any trailing non-alphanumeric characters
        }

        // If no URL is found, return null
        return null;
    }

    function sanitizeText(text) {
        return text.replace(/[*]+/g, '').trim();
    }

    function displayResults(results) {
        hideLoader(); // Ensure loader is hidden when displaying results
        contentResults.innerHTML = '';
        const order = ['blogs', 'youtube', 'substack', 'hacker_news', 'podcasts', 'reddit'];
        order.forEach(platform => {
            if (results[platform] && results[platform].length > 0) {
                const section = document.createElement('section');
                section.className = 'platform';
                section.innerHTML = `<h2>${platformIcons[platform]} ${platform.charAt(0).toUpperCase() + platform.slice(1).replace('_', ' ')}</h2>`;
                const ul = document.createElement('ul');
                results[platform].forEach(item => {
                    if (!Array.isArray(item) || item.length < 3) {
                        console.error('Invalid item format:', item);
                        return;
                    }
                    const li = document.createElement('li');
                    const url = extractUrl(item[2]);
                    const title = sanitizeText(item[0]);
                    const description = sanitizeText(item[1]);
                    if (url) {
                        if (platform === 'youtube' && item.length === 4) {
                            li.innerHTML = `
                                <div class="embed-container">
                                    <iframe width="560" height="315" src="https://www.youtube.com/embed/${item[3]}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                                </div>
                                <a href="${url}" target="_blank">
                                    <strong>${title}</strong>
                                    <span>${description}</span>
                                </a>
                            `;
                        } else {
                            li.innerHTML = `
                                <a href="${url}" target="_blank">
                                    <strong>${title}</strong>
                                    <span>${description}</span>
                                </a>
                            `;
                        }
                    } else {
                        // If no valid URL is found, just display the text without a link
                        li.innerHTML = `
                            <strong>${title}</strong>
                            <span>${description}</span>
                        `;
                    }
                    ul.appendChild(li);
                });
                section.appendChild(ul);
                contentResults.appendChild(section);
            }
        });
    }

    function exploreTopic(topic) {
        showLoader();
        fetch('/explore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `topic=${encodeURIComponent(topic)}`
        })
        .then(response => response.json())
        .then(data => {
            displayResults(data);
        })
        .catch(error => {
            hideLoader();
            contentResults.innerHTML = `<p>Error: ${error.message}</p>`;
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        exploreTopic(topicInput.value);
    });

    suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', function(e) {
            e.preventDefault();
            const topic = this.textContent;
            topicInput.value = topic;
            exploreTopic(topic);
        });
    });
});