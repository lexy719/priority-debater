import re

with open('src/components/landing/EmergentHero.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'<section id="features".*?<footer className="footer">.*?</footer>', '', c, flags=re.S)
c = c.replace('LandingPageStandalone', 'EmergentHero')

with open('src/components/landing/EmergentHero.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
