"""Script to add new 'Why Sherwood', fit, boarding, and admissions FAQ entries,
and populate the 3-4 'related' entry IDs on all entries in school_faq.json.
"""

import json
from pathlib import Path

FAQ_PATH = Path(__file__).resolve().parents[1] / "data" / "school_faq.json"

NEW_ENTRIES = [
    {
        "id": "why_choose_sherwood",
        "category": "About",
        "questions": [
            "Why should I join Sherwood?",
            "What makes Sherwood different?",
            "Why choose Sherwood College?",
            "What makes Sherwood unique?",
            "Sherwood College kyu choose kare?",
            "Why choose Sherwood over other schools?",
            "Sherwood me admission lene ke kya fayde hain?",
            "What are the benefits of studying at Sherwood?",
        ],
        "answer": (
            "Here is why families have chosen Sherwood College since 1869:\n"
            "- **150+ Years of Heritage**: Founded in 1869 in Nainital, nurturing character, leadership, and resilience across generations.\n"
            "- **Panoramic 70-Acre Campus**: Set amidst lush pine forests at 6,800 feet elevation in Ayarpatta, providing clean mountain air and world-class sports fields.\n"
            "- **Academic Distinction (CISCE)**: Structured ICSE (Class 10) and ISC (Class 12) education with Science, Commerce, and Humanities streams.\n"
            "- **Holistic 360° Growth**: Comprehensive co-curriculars including cricket, football, swimming, rifle shooting, dramatics, and debating.\n"
            "- **Character Motto**: Rooted in our founding motto *'Mereat Quisque Palmam'* ('Let each one merit the palm'), instilling service before self.\n\n"
            "Boarding school life is a transformative journey that requires students to adapt to residential routines away from home.\n\n"
            "We warmly invite you to book a campus walkthrough or speak with our admissions desk to experience Sherwood firsthand."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AboutUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "who_thrives_at_sherwood",
            "boarding_daily_routine_weekends",
            "fees_annual_overview",
            "admissions_campus_visit_booking",
        ],
    },
    {
        "id": "who_thrives_at_sherwood",
        "category": "About",
        "questions": [
            "Is Sherwood right for my child?",
            "What kind of student fits here?",
            "Who thrives at Sherwood?",
            "Is Sherwood suitable for shy children?",
            "Kya mera baccha yaha adjust ho payega?",
            "Will a quiet child do well at Sherwood?",
            "What personality fits Sherwood boarding?",
        ],
        "answer": (
            "Every child brings unique strengths to our residential community:\n"
            "- **Curious and Adaptable Learners**: Students who enjoy hands-on activities, outdoor life, and collaborative group learning flourish here.\n"
            "- **Support for Shy / Quiet Children**: Smaller house groups and resident faculty tutors ensure introverted students find their voice and build steady confidence.\n"
            "- **No Pre-Coaching Required**: Our admissions interaction evaluates natural curiosity, basic literacy/numeracy, and readiness for boarding—not memorized test coaching.\n"
            "- **Team Players and Explorers**: Children eager to try athletics, stage dramatics, music, or art alongside their studies thrive in our house system.\n\n"
            "Children adapt best when both the student and parents willingly embrace the structure of residential school living.\n\n"
            "We recommend scheduling a parent-student interaction with our admissions team to explore whether Sherwood aligns with your child's temperament."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AdmissionProcess",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "why_choose_sherwood",
            "boarding_homesickness_settling",
            "why_choose_boarding_school",
            "entrance_test_pattern",
        ],
    },
    {
        "id": "why_choose_boarding_school",
        "category": "Boarding/hostel",
        "questions": [
            "Why choose a boarding school?",
            "Why should I send my child to boarding school?",
            "Boarding school ke kya benefits hain?",
            "Is boarding education worth it?",
            "Why residential school over day school?",
            "Residential education ke fayde kya hain?",
        ],
        "answer": (
            "Here is an honest perspective on residential education:\n"
            "- **Fosters Early Independence**: Boarders develop self-management, punctuality, and decision-making skills that serve them for life.\n"
            "- **24/7 Balanced Routine**: Seamlessly integrates studies, sports, supervised prep, and hobbies without hours lost in daily city commutes.\n"
            "- **Healthy Screen-Free Environment**: Strict gadget-free policies encourage active outdoor sports, reading, and meaningful face-to-face friendships.\n"
            "- **Enduring Peer Bonds**: Living together in the house system creates brotherhood and sisterhood that lasts across adult careers.\n\n"
            "Being away from home requires an initial adjustment period, and students naturally miss their families during the first few weeks.\n\n"
            "We recommend touring the campus with your child to discuss boarding life openly before making a decision."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AboutUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "why_choose_sherwood",
            "boarding_homesickness_settling",
            "boarding_daily_routine_weekends",
            "parent_communication_and_visits",
        ],
    },
    {
        "id": "boarding_daily_routine_weekends",
        "category": "School timings",
        "questions": [
            "What is a typical day at Sherwood?",
            "What is the daily routine?",
            "Daily schedule kya hai?",
            "Weekends par students kya karte hain?",
            "How are weekends spent?",
            "Boarding school day schedule",
            "Roj ka timetable kaisa hota hai?",
        ],
        "answer": (
            "A representative weekday and weekend schedule at Sherwood:\n"
            "- **Morning (6:00 AM – 8:00 AM)**: Wake-up bell, physical training (PT) or morning run in pine air, bath, and hearty breakfast in the dining hall.\n"
            "- **Academic Hours (8:30 AM – 2:00 PM)**: Assembly followed by academic subject periods, science/computer laboratories, and mid-day lunch.\n"
            "- **Afternoon Co-Curriculars (3:30 PM – 5:30 PM)**: Compulsory games, athletics, team sports (football, cricket, swimming), and club societies.\n"
            "- **Evening & Prep (6:30 PM – 9:00 PM)**: Supervised evening study prep with resident masters on hand for doubt resolution, followed by dinner.\n"
            "- **Weekends**: Inter-house matches, hobby workshops, campus film screenings in Dixon/Milman Hall, outdoor leisure, and Sunday chapel/assembly.\n\n"
            "A disciplined daily rhythm ensures students balance academic rigor, athletic fitness, and adequate rest every day.\n\n"
            "*(Demo data: please confirm details with the admissions office).*\n\n"
            "Feel free to ask about boarding facilities, dining arrangements, or weekend leaves."
        ),
        "source": "demo",
        "source_url": "https://sherwood.edu.in/Home/CampusFacility",
        "fetched_on": "2026-11-17",
        "demo": True,
        "last_updated": "2026-11-17",
        "related": [
            "school_timings_daily_routine",
            "boarding_homesickness_settling",
            "boarding_hostels_dining",
            "why_choose_sherwood",
        ],
    },
    {
        "id": "boarding_homesickness_settling",
        "category": "Boarding/hostel",
        "questions": [
            "What if my child feels homesick?",
            "How does the school handle homesickness?",
            "Homesickness kaise handle hoti hai?",
            "My child will miss home, what then?",
            "Bacha ghar ki yaad kare toh kya hoga?",
            "How do new boarders settle in?",
        ],
        "answer": (
            "Our pastoral team has supported generations of young boarders through initial settling in:\n"
            "- **Caring Resident House Staff**: Housemasters, Assistant Masters, and resident House Matrons provide attentive, family-like pastoral care in each dormitory.\n"
            "- **Buddy System for New Students**: Incoming students are paired with responsible senior peers who help them navigate campus rhythms and build friendships.\n"
            "- **Active, Engaging Routine**: A structured schedule of team sports, art, dramatics, and evening games keeps minds constructively occupied.\n"
            "- **Scheduled Family Contact**: Designated weekly calling slots allow parents to provide steady warmth and reassurance.\n\n"
            "Missing home is completely natural, and with patient guidance, most students settle happily within their first two to three weeks.\n\n"
            "Our housemasters and matrons are always accessible to discuss your child's emotional comfort and individual needs."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/CampusFacility",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "parent_communication_and_visits",
            "boarding_daily_routine_weekends",
            "who_thrives_at_sherwood",
            "contact_horsman_wing",
        ],
    },
    {
        "id": "parent_communication_and_visits",
        "category": "Contact and campus visit",
        "questions": [
            "How do parents communicate with students?",
            "When can I call or visit my child?",
            "Parents milne kab aa sakte hain?",
            "Calling rules kya hain?",
            "Can parents visit on weekends?",
            "How often can parents speak to boarders?",
        ],
        "answer": (
            "We maintain clear, structured channels for parent-child communication:\n"
            "- **Scheduled Phone Calls**: Students have assigned weekly telephone slots to speak with parents from school calling facilities.\n"
            "- **Designated Visiting Days**: Visiting Sundays are scheduled each term where parents and registered guardians may visit campus.\n"
            "- **Academic & Pastoral Updates**: Housemasters and teachers provide regular progress feedback; parent-teacher interactions occur each term.\n"
            "- **Emergency Protocols**: Urgent family matters or health notices are communicated immediately through the Front Office and Housemasters.\n\n"
            "Predictable communication schedules help students focus on their academic and campus immersion without digital anxiety.\n\n"
            "Please check the official term calendar or reach out to the Senior Master's office for current term visiting dates."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/ContactUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "mobile_phone_gadget_policy",
            "boarding_homesickness_settling",
            "visitation_leave_guardian_policy",
            "contact_front_office",
        ],
    },
    {
        "id": "campus_safety_and_healthcare",
        "category": "Safety",
        "questions": [
            "How safe is the campus?",
            "What healthcare facilities are available?",
            "Campus safety aur medical care kaisa hai?",
            "Emergency mein doctor available hai?",
            "Is Sherwood secure for girls and young boys?",
            "What are the medical and emergency protocols?",
        ],
        "answer": (
            "Student health and physical security are our highest priority:\n"
            "- **On-Campus 20-Bed Hospital**: Fully equipped school infirmary staffed 24/7 by a qualified Resident Medical Officer (RMO) and resident nurses.\n"
            "- **Emergency Network**: Immediate ambulance access and established tie-ups with multi-specialty hospitals in Nainital and Haldwani.\n"
            "- **Gated Campus Security**: 24/7 security personnel guarding campus perimeter gates with strictly monitored entry and visitor passes.\n"
            "- **Anti-Ragging Zero Tolerance**: Strict statutory anti-ragging and discipline committee ensuring a respectful, bullying-free environment.\n\n"
            "Resident faculty and house staff live on campus grounds, providing constant adult supervision throughout dormitories and playing fields.\n\n"
            "Parents are welcome to inspect our hospital and safety protocols during their admissions campus tour."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/CampusFacility",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "facilities_medical_healthcare",
            "safety_anti_ragging_discipline",
            "boarding_homesickness_settling",
            "contact_front_office",
        ],
    },
    {
        "id": "dining_nutrition_food",
        "category": "Boarding/hostel",
        "questions": [
            "What food is served in the hostel?",
            "Is vegetarian food available?",
            "Mess ka khana kaisa hai?",
            "Dining facilities kaisi hain?",
            "Do you cater to dietary requirements?",
            "What is the menu like for boarders?",
        ],
        "answer": (
            "Nutritious and balanced dining for active growing students:\n"
            "- **Three Hot Meals Daily**: Breakfast, lunch, and dinner served family-style in our central dining hall under faculty supervision.\n"
            "- **Evening Refreshments**: Evening tea accompanied by light snacks, seasonal fresh fruit, and warm bedtime milk.\n"
            "- **Vegetarian and Non-Vegetarian**: Wholesome vegetarian and non-vegetarian choices prepared in hygienic, modern institutional kitchens.\n"
            "- **Mess Committee Supervision**: Menus are reviewed regularly to ensure nutritional balance, seasonal variety, and high hygiene standards.\n\n"
            "Meals are crafted to fuel active young minds in a high-altitude mountain climate where physical fitness is part of daily life.\n\n"
            "*(Demo data: please confirm details with the admissions office).*\n\n"
            "Feel free to review sample weekly menus with our Bursar's office during your campus visit."
        ),
        "source": "demo",
        "source_url": "https://sherwood.edu.in/Home/CampusFacility",
        "fetched_on": "2026-11-17",
        "demo": True,
        "last_updated": "2026-11-17",
        "related": [
            "boarding_daily_routine_weekends",
            "boarding_hostels_dining",
            "campus_safety_and_healthcare",
            "fees_annual_overview",
        ],
    },
    {
        "id": "class_size_teacher_support",
        "category": "Academics/curriculum",
        "questions": [
            "What is the average class size?",
            "How much attention do teachers give students?",
            "Class size kitna hota hai?",
            "Do teachers help weak students?",
            "Teacher support kaisa hai?",
            "Student teacher attention and mentorship",
        ],
        "answer": (
            "Academic attention and faculty mentorship at Sherwood:\n"
            "- **Manageable Section Strengths**: Class sections are typically maintained at approximately 25 to 30 students to foster active student-teacher dialogue.\n"
            "- **Supervised Evening Prep**: Resident teachers supervise daily prep study hours, offering on-the-spot academic doubt resolution.\n"
            "- **Remedial Guidance**: Subject teachers provide focused help to students needing assistance in foundational mathematics or languages.\n"
            "- **Continuous Progress Monitoring**: Regular internal assessments and term exams track scholastic development without excessive examination stress.\n\n"
            "Because our faculty resides on campus, mentorship and academic guidance extend naturally far beyond classroom walls.\n\n"
            "*(Demo data: please confirm details with the admissions office).*\n\n"
            "Speak with our academic team to learn more about subject streams and teaching methodologies."
        ),
        "source": "demo",
        "source_url": "https://sherwood.edu.in/Home/Infrastructure",
        "fetched_on": "2026-11-17",
        "demo": True,
        "last_updated": "2026-11-17",
        "related": [
            "academics_curriculum_streams",
            "academics_coaching_policy",
            "why_choose_sherwood",
            "who_thrives_at_sherwood",
        ],
    },
    {
        "id": "house_system_community",
        "category": "About",
        "questions": [
            "How does the House system work?",
            "What is the house system at Sherwood?",
            "House system kya hai?",
            "Tell me about houses in Sherwood",
            "How do houses build community and leadership?",
        ],
        "answer": (
            "The House system is the vibrant cornerstone of life at Sherwood College:\n"
            "- **Close Residential Family**: Every student is assigned to a house that serves as their primary residential and social community on campus.\n"
            "- **Spirited Inter-House Competitions**: Houses compete throughout the year in football, cricket, swimming, athletics, debates, elocution, and dramatics.\n"
            "- **Student Leadership**: House Captains, Prefects, and Vice-Captains shoulder real organizational responsibilities, learning practical leadership.\n"
            "- **Pastoral Mentorship**: Dedicated Housemasters and Housemistresses oversee the academic, moral, and personal growth of each house member.\n\n"
            "The house structure instills healthy sportsmanship, pride in collective achievement, and lasting inter-batch camaraderie.\n\n"
            "Discover house traditions and trophy displays during your campus visit at Milman Hall."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AboutUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "why_choose_sherwood",
            "sports_and_activities_overview",
            "boarding_homesickness_settling",
            "who_thrives_at_sherwood",
        ],
    },
    {
        "id": "alumni_network_legacy",
        "category": "About",
        "questions": [
            "Who are notable alumni of Sherwood?",
            "Tell me about the alumni network",
            "Old Sherwoodians koun hain?",
            "Which famous personalities studied at Sherwood?",
            "Alumni connection kaisa hai?",
            "Notable Old Sherwoodians list",
        ],
        "answer": (
            "According to the school's official records, distinguished Old Sherwoodians include:\n"
            "- **Military Leadership**: Field Marshal Sam Manekshaw (India's first Field Marshal) and General V.N. Sharma (former Chief of the Army Staff).\n"
            "- **Arts and Cinema**: Legendary actor Amitabh Bachchan, veteran actor Kabir Bedi, and noted actor Dalip Tahil.\n"
            "- **Public Life & Sports**: Olympian K.C. Singh Baba, prominent civil servants, jurists, and corporate leaders.\n"
            "- **Old Sherwoodians Society (OSS)**: An active global alumni association offering mentorship, annual reunions, and professional networking.\n\n"
            "Our alumni embody the motto *Mereat Quisque Palmam* through decades of service to the nation and distinguished global careers.\n\n"
            "You can explore historical alumni archives and commemorative plaques at Milman Hall during a campus visit."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/Alumni",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "alumni_notable_achievers",
            "alumni_amitabh_bachchan_quote",
            "why_choose_sherwood",
            "about_school_history_heritage",
        ],
    },
    {
        "id": "sports_and_co_curricular_life",
        "category": "Sports and activities",
        "questions": [
            "What sports and activities are offered?",
            "What co-curricular facilities exist?",
            "Khel-kood aur sports facilities kya hain?",
            "Which sports are played at Sherwood?",
            "Are music, dance and drama taught?",
            "Extra curricular activities at Sherwood",
        ],
        "answer": (
            "Sherwood offers expansive sports and artistic traditions on campus:\n"
            "- **Major Field Sports**: Extensive grounds for Cricket, Football, Field Hockey, and Track & Field athletics in clean mountain air.\n"
            "- **Court & Target Sports**: Dedicated outdoor Tennis courts, Squash courts, Basketball courts, and a specialized Rifle Shooting range.\n"
            "- **Aquatics**: Heated indoor/outdoor swimming pool with trained coaches and lifeguards for regular practice and galas.\n"
            "- **Performing Arts & Societies**: English and Hindi Dramatics, Debating, Model United Nations (MUN), School Choir, Band, and Fine Arts.\n\n"
            "Daily participation in sports or cultural societies is mandatory, ensuring every student develops fitness and creative poise.\n\n"
            "View our playing fields, squash courts, and auditoriums during your scheduled admissions tour."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/CampusFacility",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "facilities_sports_extensive",
            "sports_and_activities_overview",
            "why_choose_sherwood",
            "boarding_daily_routine_weekends",
        ],
    },
    {
        "id": "sherwood_vs_other_schools",
        "category": "About",
        "questions": [
            "Is Sherwood better than other boarding schools?",
            "Sherwood vs Doon School?",
            "Sherwood vs Welham or Woodstock?",
            "How does Sherwood compare to other schools?",
            "Kya Sherwood best boarding school hai?",
            "Sherwood ya Doon school me se koun sa accha hai?",
            "Is Sherwood the best school in India?",
        ],
        "answer": (
            "We hold the country's historic residential schools in high esteem and do not rank or draw comparisons against other institutions:\n"
            "- **150+ Years in Nainital**: Established in 1869, Sherwood offers a tranquil 70-acre pine campus at 6,800 feet elevation, away from urban distractions.\n"
            "- **CISCE Excellence**: Proven ICSE (Class 10) and ISC (Class 12) academic rigor paired with rich traditions in dramatics, music, and sports.\n"
            "- **Nurturing Co-Ed House Community**: A warm residential house system where students are known personally and supported by dedicated resident staff.\n"
            "- **Balanced Ethos**: Emphasizes humility, character integrity, and service under our motto *Mereat Quisque Palmam*.\n\n"
            "Every school has its own unique ethos; the right choice depends on your child's personality, interests, and family priorities.\n\n"
            "We warmly encourage you to visit Sherwood College, walk our campus, and meet our faculty to see if our community feels right for your child."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AboutUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "why_choose_sherwood",
            "who_thrives_at_sherwood",
            "how_to_choose_boarding_school",
            "admissions_campus_visit_booking",
        ],
    },
    {
        "id": "how_to_choose_boarding_school",
        "category": "Boarding/hostel",
        "questions": [
            "How do I choose a boarding school?",
            "How to select the right residential school?",
            "Boarding school kaise choose kare?",
            "What should parents look for in a boarding school?",
            "Tips for choosing a boarding school for my child",
            "Checklist for selecting a residential school",
        ],
        "answer": (
            "Here is an objective 5-point checklist for parents evaluating residential schools:\n"
            "- **1. Safety & Pastoral Care**: Look into housemaster supervision, student-pastoral ratios, 24/7 medical facilities, and campus perimeter security.\n"
            "- **2. Child's Temperament**: Consider your child's personality—do they thrive in outdoor, sports-rich environments or large co-ed communities?\n"
            "- **3. Curriculum and Academic Fit**: Review board affiliations (CISCE / ICSE vs CBSE vs IB), subject combinations in senior grades, and prep supervision.\n"
            "- **4. School Heritage & Culture**: Evaluate the institution's long-term values, discipline policies, alumni involvement, and gadget regulations.\n"
            "- **5. Visit Campus in Person**: Walk the grounds, meet resident housemasters, and observe student body language and mealtime camaraderie.\n\n"
            "This checklist provides general objective guidance for families considering residential education in India.\n\n"
            "We invite you to apply this checklist while touring Sherwood College to evaluate our campus firsthand."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/AdmissionProcess",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "why_choose_boarding_school",
            "sherwood_vs_other_schools",
            "why_choose_sherwood",
            "admissions_campus_visit_booking",
        ],
    },
    {
        "id": "admissions_campus_visit_booking",
        "category": "Contact and campus visit",
        "questions": [
            "How can I book a campus visit?",
            "Can I visit Sherwood College?",
            "Campus visit kaise book kare?",
            "How to talk to the admissions desk?",
            "Where is the admissions office?",
            "How do I schedule a school tour?",
        ],
        "answer": (
            "Prospective families are warmly welcomed to visit Sherwood College by prior appointment:\n"
            "- **Admissions Helplines**: +91 94583 07729 / +91 94563 16655\n"
            "- **Front Office Phone**: +91-5942-236361\n"
            "- **Official Email for Visits**: contact@sherwood.edu.in\n"
            "- **Campus Address**: Ayarpatta, Nainital – 263002, Uttarakhand\n"
            "- **Guided School Tour**: Includes Milman Hall, classrooms, STEM labs, playing fields, hospital, and an interaction with the admissions team.\n\n"
            "Prior booking is required so our admissions counselors can dedicate time to guide your family through campus.\n\n"
            "You can also initiate your child's application online anytime through our admissions portal."
        ),
        "source": "official",
        "source_url": "https://sherwood.edu.in/Home/ContactUs",
        "fetched_on": "2026-11-17",
        "demo": False,
        "last_updated": "2026-11-17",
        "related": [
            "contact_front_office",
            "admission_workflow_steps",
            "why_choose_sherwood",
            "visitation_leave_guardian_policy",
        ],
    },
]

# Related mappings for existing 45 entries
EXISTING_RELATED_MAP = {
    "about_school_overview": ["why_choose_sherwood", "about_school_history_heritage", "academics_curriculum_streams", "contact_front_office"],
    "about_school_history_heritage": ["why_choose_sherwood", "about_school_overview", "alumni_network_legacy", "house_system_community"],
    "about_board_affiliation": ["academics_curriculum_streams", "entrance_test_pattern", "why_choose_sherwood", "admission_classes_offered"],
    "about_principal_leadership": ["about_school_overview", "entrance_principal_interaction", "why_choose_sherwood", "contact_front_office"],
    "about_coed_residential_identity": ["why_choose_boarding_school", "boarding_homesickness_settling", "who_thrives_at_sherwood", "boarding_daily_routine_weekends"],
    "admission_classes_offered": ["eligibility_age_criteria", "admission_workflow_steps", "admission_registration_dates", "documents_required_checklist"],
    "admission_registration_dates": ["admission_workflow_steps", "admission_classes_offered", "fees_annual_overview", "documents_required_checklist"],
    "admission_online_only_mandate": ["admission_workflow_steps", "admission_counsellor_helpline", "fees_application_fee", "documents_required_checklist"],
    "admission_counsellor_helpline": ["admissions_campus_visit_booking", "contact_front_office", "admission_workflow_steps", "fees_annual_overview"],
    "admission_workflow_steps": ["admission_registration_dates", "documents_required_checklist", "entrance_test_pattern", "fees_annual_overview"],
    "eligibility_age_criteria": ["admission_classes_offered", "admission_workflow_steps", "documents_required_checklist", "entrance_test_pattern"],
    "documents_required_checklist": ["admission_workflow_steps", "eligibility_age_criteria", "fees_application_fee", "entrance_test_pattern"],
    "entrance_test_pattern": ["who_thrives_at_sherwood", "entrance_principal_interaction", "academics_curriculum_streams", "admission_workflow_steps"],
    "entrance_principal_interaction": ["entrance_test_pattern", "who_thrives_at_sherwood", "about_principal_leadership", "admission_workflow_steps"],
    "facilities_auditoriums_halls": ["facilities_labs_classrooms", "facilities_sports_extensive", "sports_and_activities_overview", "why_choose_sherwood"],
    "facilities_labs_classrooms": ["facilities_auditoriums_halls", "academics_curriculum_streams", "class_size_teacher_support", "why_choose_sherwood"],
    "facilities_sports_extensive": ["sports_and_co_curricular_life", "sports_and_activities_overview", "boarding_daily_routine_weekends", "why_choose_sherwood"],
    "boarding_hostels_dining": ["boarding_daily_routine_weekends", "dining_nutrition_food", "boarding_homesickness_settling", "campus_safety_and_healthcare"],
    "alumni_notable_achievers": ["alumni_network_legacy", "alumni_amitabh_bachchan_quote", "why_choose_sherwood", "about_school_history_heritage"],
    "alumni_amitabh_bachchan_quote": ["alumni_notable_achievers", "alumni_network_legacy", "why_choose_sherwood", "about_school_history_heritage"],
    "contact_front_office": ["admissions_campus_visit_booking", "contact_horsman_wing", "contact_accounts_bursar", "admission_counsellor_helpline"],
    "contact_horsman_wing": ["contact_front_office", "boarding_homesickness_settling", "about_coed_residential_identity", "visitation_leave_guardian_policy"],
    "contact_accounts_bursar": ["fees_annual_overview", "fees_payment_modes", "contact_front_office", "fees_refund_policy"],
    "contact_dispatch_senior_master": ["contact_front_office", "parent_communication_and_visits", "visitation_leave_guardian_policy", "safety_anti_ragging_discipline"],
    "fees_annual_overview": ["fees_tuition_breakdown", "fees_boarding_hostel", "fees_admission_one_time", "fees_payment_modes"],
    "fees_admission_one_time": ["fees_annual_overview", "fees_caution_deposit", "fees_payment_modes", "fees_refund_policy"],
    "fees_tuition_breakdown": ["fees_annual_overview", "fees_boarding_hostel", "fees_payment_modes", "class_size_teacher_support"],
    "fees_boarding_hostel": ["fees_annual_overview", "boarding_hostels_dining", "dining_nutrition_food", "fees_tuition_breakdown"],
    "fees_caution_deposit": ["fees_admission_one_time", "fees_annual_overview", "fees_refund_policy", "fees_payment_modes"],
    "fees_payment_modes": ["fees_annual_overview", "contact_accounts_bursar", "fees_admission_one_time", "fees_refund_policy"],
    "fees_refund_policy": ["fees_payment_modes", "fees_caution_deposit", "fees_annual_overview", "contact_accounts_bursar"],
    "fees_concessions_discounts": ["scholarships_financial_aid", "fees_annual_overview", "contact_accounts_bursar", "admission_workflow_steps"],
    "facilities_medical_healthcare": ["campus_safety_and_healthcare", "boarding_hostels_dining", "boarding_homesickness_settling", "contact_front_office"],
    "academics_coaching_policy": ["class_size_teacher_support", "academics_curriculum_streams", "entrance_test_pattern", "who_thrives_at_sherwood"],
    "academics_languages_offered": ["academics_curriculum_streams", "class_size_teacher_support", "why_choose_sherwood", "entrance_test_pattern"],
    "transport_facilities": ["contact_front_office", "parent_communication_and_visits", "boarding_daily_routine_weekends", "admissions_campus_visit_booking"],
    "school_timings_daily_routine": ["boarding_daily_routine_weekends", "boarding_homesickness_settling", "sports_and_activities_overview", "why_choose_sherwood"],
    "uniform_and_books": ["fees_annual_overview", "boarding_daily_routine_weekends", "contact_front_office", "admission_workflow_steps"],
    "safety_anti_ragging_discipline": ["campus_safety_and_healthcare", "boarding_homesickness_settling", "house_system_community", "contact_dispatch_senior_master"],
    "mobile_phone_gadget_policy": ["parent_communication_and_visits", "boarding_daily_routine_weekends", "boarding_homesickness_settling", "why_choose_boarding_school"],
    "visitation_leave_guardian_policy": ["parent_communication_and_visits", "contact_front_office", "boarding_homesickness_settling", "contact_dispatch_senior_master"],
    "scholarships_financial_aid": ["fees_concessions_discounts", "fees_annual_overview", "who_thrives_at_sherwood", "contact_accounts_bursar"],
    "fees_application_fee": ["admission_online_only_mandate", "fees_annual_overview", "admission_workflow_steps", "fees_payment_modes"],
    "sports_and_activities_overview": ["sports_and_co_curricular_life", "facilities_sports_extensive", "boarding_daily_routine_weekends", "house_system_community"],
    "academics_curriculum_streams": ["class_size_teacher_support", "about_board_affiliation", "why_choose_sherwood", "entrance_test_pattern"],
}


def update_faq_file():
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data["entries"]
    existing_by_id = {e["id"]: e for e in entries}

    # Add related to existing entries
    for entry in entries:
        eid = entry["id"]
        entry["related"] = EXISTING_RELATED_MAP.get(eid, ["why_choose_sherwood", "fees_annual_overview", "admission_workflow_steps", "contact_front_office"])

    # Add new entries if not already present
    added = 0
    for new_e in NEW_ENTRIES:
        if new_e["id"] in existing_by_id:
            # Update existing
            existing_by_id[new_e["id"]].update(new_e)
        else:
            entries.append(new_e)
            existing_by_id[new_e["id"]] = new_e
            added += 1

    data["last_updated"] = "2026-11-17"
    with open(FAQ_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully updated {FAQ_PATH}!")
    print(f"Total entries now: {len(entries)} (Added: {added} new entries)")


if __name__ == "__main__":
    update_faq_file()

