import os
from flask import Flask, render_template, request, jsonify
import requests
import random
import re

app = Flask(__name__)

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

def extract_youtube_id(url):
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    return match.group(1) if match else None

def explore_topic(topic):
    platforms = {
        "blogs": f"Find 3 insightful personal blog posts about {topic}. Format: Title | Author | URL",
        "youtube": f"Suggest 3 YouTube videos about {topic}. Format: Title | Channel | URL",
        "substack": f"Find 3 Substack articles about {topic}. Format: Title | Author | URL",
        "hacker_news": f"Find 3 relevant Hacker News discussions about {topic}. Format: Title | URL",
        "podcasts": f"Suggest 3 podcast episodes about {topic}. Format: Episode Title | Podcast Name | URL",
        "reddit": f"Find 3 relevant Reddit posts discussing {topic}. Format: Title | Subreddit | URL"
    }

    results = {}
    for platform, prompt in platforms.items():
        payload = {
            "model": "llama-3-sonar-large-32k-online",
            "messages": [
                {"role": "system", "content": "Provide concise, formatted responses."},
                {"role": "user", "content": prompt}
            ]
        }
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {PERPLEXITY_API_KEY}"
        }

        try:
            response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            content = response.json()['choices'][0]['message']['content']
            items = [item.strip().split(" | ") for item in content.split("\n") if " | " in item]
            if platform == 'youtube':
                for item in items:
                    if len(item) == 3:
                        item.append(extract_youtube_id(item[2]))
            results[platform] = items
        except Exception as e:
            results[platform] = []

    return results

@app.route('/')
def home():
    suggested_topics = [
        "Artificial Intelligence", "Climate Change", "Space Exploration",
        "Quantum Computing", "Renewable Energy", "Blockchain Technology",
        "Genetic Engineering", "Virtual Reality", "Sustainable Agriculture",
        "Neuroscience Breakthroughs"
    ]
    return render_template('index.html', suggested_topics=suggested_topics)

@app.route('/explore', methods=['POST'])
def explore():
    topic = request.form['topic']
    results = explore_topic(topic)
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)