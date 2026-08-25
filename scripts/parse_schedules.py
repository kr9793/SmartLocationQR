import json
import pdfplumber
import glob
import os

def parse_schedules():
    locations_file = os.path.join('assets', 'data', 'locations.json')
    with open(locations_file, 'r', encoding='utf-8') as f:
        locations_data = json.load(f)

    # Map name to ID
    loc_map = {}
    for loc in locations_data:
        loc_map[loc['name'].lower()] = loc['id']
        loc_map["p" + loc['name'].lower()] = loc['id']
        # e.g., "pl-116" matches id for "L-116"

    pdf_files = glob.glob('*.pdf')
    schedule_dict = {}

    for pdf_file in pdf_files:
        print(f"Parsing {pdf_file}...")
        
        with pdfplumber.open(pdf_file) as pdf:
            current_session_info = None
            current_location_id = None
            
            for page in pdf.pages:
                table = page.extract_table()
                if not table: continue
                
                for row in table:
                    # Skip empty rows or title rows
                    if not row or not any(row):
                        continue
                    if row[0] and ('TS ID' in str(row[0]) or 'CONFERENCE RECORD' in str(row[0])):
                        continue
                    
                    # New session block starts when row[0] (TS ID) is populated
                    if row[0]: 
                        venue_str = str(row[4]).lower() if len(row) > 4 and row[4] else ""
                        
                        loc_id = None
                        if "online" in pdf_file.lower() or "meet" in venue_str:
                            loc_id = 17
                        else:
                            for loc_name, lid in loc_map.items():
                                if loc_name in venue_str:
                                    loc_id = lid
                                    break
                        
                        if loc_id:
                            current_location_id = loc_id
                            if loc_id not in schedule_dict:
                                schedule_dict[loc_id] = {}
                            
                            day_full = str(row[2]).replace('\n', ' ').strip() if len(row) > 2 else ""
                            time_str = str(row[3]).replace('\n', ' ').strip() if len(row) > 3 else ""
                            session_type = str(row[1]).replace('\n', ' ').strip() if len(row) > 1 else ""
                            
                            if session_type == "None" or not session_type:
                                current_session_info = None
                                current_location_id = None
                                continue

                            session_key = f"{day_full}_{time_str}"
                            if session_key not in schedule_dict[loc_id]:
                                schedule_dict[loc_id][session_key] = {
                                    "day": "Day 01 (29/08/2026)" if "Day 01" in day_full else "Day 02 (30/08/2026)",
                                    "type": session_type,
                                    "time": time_str,
                                    "papers": []
                                }
                            current_session_info = schedule_dict[loc_id][session_key]
                        else:
                            current_session_info = None
                            current_location_id = None
                    
                    # Add paper if within a matched session
                    if current_session_info and current_location_id and len(row) > 8 and row[5]:
                        current_session_info["papers"].append({
                            "id": str(row[5]).strip(),
                            "track": str(row[7]).strip() if row[7] else "General",
                            "title": str(row[6]).replace('\n', ' ').strip() if row[6] else "Unknown Title",
                            "presenter": str(row[8]).replace('\n', ' ').strip() if row[8] else "Unknown Presenter"
                        })

    final_output = []
    for loc_id, sessions_dict in schedule_dict.items():
        final_output.append({
            "location_id": loc_id,
            "sessions": list(sessions_dict.values())
        })
        
    out_file = os.path.join('assets', 'data', 'schedule.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4)
        
    print(f"Successfully generated {out_file} with {len(final_output)} locations.")

if __name__ == "__main__":
    parse_schedules()
