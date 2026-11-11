// Official school knowledge is maintained server-side in backend/app/school_knowledge.py.
// The local frequentlyAskedQuestions array provides an instant client-side offline shortcut
// for exact keyword matches. When updating official school facts, ensure entries here remain
// in sync with backend/app/school_knowledge.py.

const frequentlyAskedQuestions = [
  {
    terms: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "namaste", "greetings", "hii", "heyy"],
    answer: "Hello! Welcome to Sherwood College. I am Sherwood AI, here to help you with 2027–28 admissions, fee structures, eligibility criteria, required documents, entrance exams, and campus life. How can I help you today?",
  },
  {
    terms: ["who are you", "what can you do", "what is sherwood ai", "how can you help", "what do you do", "help"],
    answer: "I am Sherwood AI, the official virtual assistant for Sherwood College, Nainital.\n\nI can assist you with:\n- **Admissions & Eligibility**: Classes offered (Classes 3 to 9 and Class 11), age criteria, and registration steps\n- **Fee Structure**: Annual charges (~Rs. 7.5 to 8 lakh) and payment schedules\n- **Entrance Tests**: Online test format, subjects (English & Mathematics), and dates\n- **Boarding Life**: Dormitory accommodation, pastoral care, meals, and campus discipline\n- **Rules & Policies**: Gadget prohibition, calling hours, and visitation\n\nAsk me any question or choose one of the suggested topics below!",
  },
  {
    terms: ["where is the school", "where is sherwood", "location", "address", "where is it located", "nainital"],
    answer: "Sherwood College is situated in Nainital, Uttarakhand, India. The historic boarding school offers a nurturing environment with dormitory-style living, resident 24/7 medical care, comprehensive sports, and dedicated pastoral supervision.",
  },
  {
    terms: ["thank you", "thanks", "thx", "thank u", "great thanks", "appreciate it"],
    answer: "You are most welcome! Please feel free to ask if you have any more questions about admissions, academics, or campus life at Sherwood College.",
  },
  {
    terms: ["class 10", "class 12", "grade 10", "grade 12"],
    answer: "Admissions are not offered for Classes 10 and 12. For Grades 9 and 11, admission eligibility is based on entrance-test and interview performance. For Class 11, the selected stream is also considered.",
  },
  {
    terms: ["class 3", "class 4", "class 5", "class 6", "class 7", "class 8", "class 9", "class 11", "grade 3", "grade 4", "grade 5", "grade 6", "grade 7", "grade 8", "grade 9", "grade 11", "birth year", "age cutoff", "age criteria", "age limit", "eligible age"],
    answer: "For 2027–28, the permitted birth years are: Class 3 — 2018 or 2019; Class 4 — 2017 or 2018; Class 5 — 2016 or 2017; Class 6 — 2015 or 2016; Class 7 — 2014 or 2015; Class 8 — 2013 or 2014; Class 9 — 2012 or 2013; and Class 11 — 2010 or 2011.",
  },
  {
    terms: ["entrance test", "entrance exam", "test pattern", "sample paper", "online test", "mathematics paper", "syllabus"],
    answer: "The entrance test is conducted online. It includes English and Mathematics, with one hour allowed for each paper. The test syllabus, date and time are emailed after website registration.",
  },
  {
    terms: ["principal", "interaction", "interview", "panel"],
    answer: "After qualifying the entrance test, the child moves to the Principal's Interaction. The interaction panel decides the outcome based on its assessment.",
  },
  {
    terms: ["document", "documents", "aadhaar", "aadhar", "birth certificate", "mark sheet", "marksheet", "transfer certificate", "tc", "required documents"],
    answer: "Please keep the student's Aadhaar Card, a Birth Certificate issued by the Nagar Nigam/Municipal Department, and the most recent mark sheet ready. Once admission is confirmed, the original Transfer Certificate must be submitted to the school office.",
  },
  {
    terms: ["apply", "application process", "application workflow", "how to register", "how do i register", "how to apply", "offer letter", "how do i apply"],
    answer: "First register on the school website. The entrance-test syllabus, date and time will be emailed. Children who qualify the entrance test proceed to the Principal's Interaction, and successful applicants receive an offer letter by email.",
  },
  {
    terms: ["seat", "availability", "deadline", "last date", "admission close"],
    answer: "Admissions close as and when seats are filled. Please contact the admissions team to confirm current seat availability.",
  },
  {
    terms: ["fee", "fees", "fee structure", "fees structure", "annual fees", "cost", "charges", "pocket money", "imprest", "7.5", "8 lakh", "8 lacks", "payment", "installment", "instalment"],
    answer: "The total annual charges, including all components, are approximately Rs. 7.5 lakh to Rs. 8 lakh. This is paid in two terms: Rs. 5 lakh at admission and an approximately Rs. 2.5 lakh to Rs. 3 lakh bill in June.",
  },
  {
    terms: ["refund", "withdraw", "withdrawal", "scholarship", "sibling discount", "alumni concession", "defence concession"],
    answer: "There is no refund for a mid-term withdrawal, and the school does not offer scholarships.",
  },
  {
    terms: ["dorm", "hostel", "boarding", "room", "accommodation", "hostels"],
    answer: "Accommodation is dormitory-style. Boarding is organised house-wise, with a Matron and Warden in every house, supported by House Masters and House Tutors.",
  },
  {
    terms: ["matron", "warden", "house master", "house tutor", "pastoral"],
    answer: "Boarding is managed house-wise. Every house has one Matron and one Warden, with House Masters and House Tutors providing additional supervision.",
  },
  {
    terms: ["clothing", "checklist", "move in", "move-in", "medical form", "laundry", "linen"],
    answer: "After admission, the school provides the medical forms and clothing checklist. Each house has its own laundry staff.",
  },
  {
    terms: ["bully", "bullying", "ragging", "cctv", "discipline"],
    answer: "Bullying and ragging are taken seriously and can lead to suspension or expulsion.",
  },
  {
    terms: ["coaching", "sat", "jee", "neet", "cuet", "clat"],
    answer: "The school does not provide on-campus competitive coaching for SAT, JEE, NEET, CUET, CLAT or similar examinations.",
  },
  {
    terms: ["sport", "sports", "game", "games", "co-curricular", "activity", "activities", "inter house", "inter-house"],
    answer: "The school encourages students to play all games. Inter-house matches are conducted for games and co-curricular activities.",
  },
  {
    terms: ["foreign language", "second language", "language option"],
    answer: "Foreign languages are not offered.",
  },
  {
    terms: ["phone", "phones", "mobile", "mobiles", "smartphone", "laptop", "laptops", "smartwatch", "gadget", "gadgets", "device", "devices"],
    answer: "Smartphones, basic phones, laptops and smartwatches are strictly not allowed on campus.",
  },
  {
    terms: ["call", "calling", "video call", "video calling", "15 minute", "phone call"],
    answer: "Parent calling is limited to 15 minutes per week.",
  },
  {
    terms: ["exeat", "overnight", "night leave", "outing", "leave"],
    answer: "One overnight leave is allowed in a term, subject to change.",
  },
  {
    terms: ["local guardian", "guardian", "nainital district"],
    answer: "A Local Guardian must be within Nainital district.",
  },
  {
    terms: ["campus visit", "visit campus", "visit booking", "admission counsellor"],
    answer: "Before admission, please contact the admissions counsellor to arrange a campus visit. After admission, please contact the House Master.",
  },
  {
    terms: ["meal", "meals", "mess", "vegetarian", "non veg", "non-veg", "jain", "food", "dining"],
    answer: "Vegetarian and non-vegetarian meals are available. Outside food is not allowed on campus.",
  },
  {
    terms: ["tuck", "parcel", "outside food"],
    answer: "Outside food is not allowed on campus.",
  },
  {
    terms: ["doctor", "infirmary", "ambulance", "hospital", "healthcare", "health care", "medical emergency", "medical"],
    answer: "A resident doctor is available 24/7, supported by two staff nurses and a fully equipped ambulance. Visiting doctors attend on alternate days. Emergency support is available through B. D. Pandey Hospital and hospitals in Haldwani.",
  },
  {
    terms: ["psychologist", "mental health", "mental wellness", "counselling support"],
    answer: "On-campus child psychologist and mental-wellness support are available.",
  },
  {
    terms: ["routine", "timetable", "wake up", "lights out", "study hour", "evening prep", "remedial", "daily routine"],
    answer: "Please contact the admissions team for the current daily timetable, evening prep supervision and remedial-support schedule.",
  },
];

function matchesTerm(questionText, term) {
  const cleanQuestion = questionText.toLowerCase();
  const cleanTerm = term.toLowerCase();
  if (cleanTerm.includes(" ")) {
    return cleanQuestion.includes(cleanTerm);
  }
  // Word boundary check for single words to avoid partial matching (e.g. "hi" in "this")
  const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|\\b|\\s)${escaped}(\\b|\\s|[?!.,]|$)`, "i");
  return regex.test(cleanQuestion);
}

export function getSchoolInformationAnswer(question) {
  if (!question || typeof question !== "string") return null;
  const normalized = question.trim();
  const matched = frequentlyAskedQuestions.find(({ terms }) =>
    terms.some((term) => matchesTerm(normalized, term))
  );
  return matched?.answer || null;
}
