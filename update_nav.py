import os
import re

nav_html = '''            <nav class="home-nav">
                <a href="index.html" class="nav-link{home_active}">Home</a>
                <a href="schedule.html" class="nav-link{sched_active}">Schedule</a>
                <a href="venues.html" class="nav-link{venues_active}">Venues</a>
            </nav>'''

def update_nav(filepath, active_page):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r'<nav class="home-nav">.*?</nav>'
    
    new_nav = nav_html.format(
        home_active=' active' if active_page == 'home' else '',
        sched_active=' active' if active_page == 'sched' else '',
        venues_active=' active' if active_page == 'venues' else ''
    )
    
    new_content = re.sub(pattern, new_nav, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

update_nav('venues.html', 'venues')
update_nav('schedule.html', 'sched')
update_nav('location.html', '')
print('Nav updated!')
