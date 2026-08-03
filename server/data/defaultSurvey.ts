// Default survey template for Murdoch University
export const DEFAULT_SURVEY = {
  title: "Travel Habits of International Students at Murdoch University",
  description: "This survey investigates the travel habits and preferences of international students at Murdoch University.",
  questions: [
    {
      id: "q1",
      type: "radio",
      text: "How often do you travel during your studies?",
      options: [
        "Every week",
        "2-3 times per month",
        "Once a month",
        "A few times per semester",
        "Rarely or never"
      ],
      required: true
    },
    {
      id: "q2",
      type: "radio",
      text: "What is your primary mode of transportation?",
      options: [
        "Personal car",
        "Public bus",
        "Train",
        "Bicycle",
        "Walking",
        "Rideshare (Uber, etc.)"
      ],
      required: true
    },
    {
      id: "q3",
      type: "checkbox",
      text: "Which countries or regions have you visited while studying in Australia?",
      options: [
        "New Zealand",
        "Singapore",
        "Indonesia (Bali)",
        "Malaysia",
        "Thailand",
        "Japan",
        "South Korea",
        "Other"
      ],
      required: true
    },
    {
      id: "q4",
      type: "radio",
      text: "What is your average travel budget per trip (AUD)?",
      options: [
        "Under $500",
        "$500 - $1,000",
        "$1,000 - $2,000",
        "$2,000 - $5,000",
        "Over $5,000"
      ],
      required: true
    },
    {
      id: "q5",
      type: "checkbox",
      text: "Who do you usually travel with?",
      options: [
        "Alone",
        "Friends from university",
        "Friends from home country",
        "Family members",
        "Organized tour group"
      ],
      required: true
    },
    {
      id: "q6",
      type: "checkbox",
      text: "What factors influence your travel decisions?",
      options: [
        "Cost/Budget",
        "Time availability",
        "Weather/Season",
        "Destination popularity",
        "Cultural attractions",
        "Adventure opportunities",
        "Academic schedule"
      ],
      required: true
    },
    {
      id: "q7",
      type: "radio",
      text: "How do you usually book your travel arrangements?",
      options: [
        "Online travel platforms (Booking.com, Expedia, etc.)",
        "Travel agency",
        "Airline/Transport company websites",
        "Social media recommendations",
        "Direct contact with hotels/providers"
      ],
      required: true
    },
    {
      id: "q8",
      type: "radio",
      text: "What type of accommodation do you prefer when traveling?",
      options: [
        "Hotel",
        "Hostel",
        "Airbnb/ Vacation rental",
        "Student dormitory/Hostel",
        "Camping",
        "Staying with friends/family"
      ],
      required: true
    },
    {
      id: "q9",
      type: "checkbox",
      text: "What activities do you enjoy most while traveling?",
      options: [
        "Sightseeing/Visiting landmarks",
        "Beach activities",
        "Hiking/Outdoor adventures",
        "Food and cuisine exploration",
        "Shopping",
        "Cultural experiences/Museums",
        "Nightlife/Entertainment"
      ],
      required: true
    },
    {
      id: "q10",
      type: "textarea",
      text: "Please share any memorable travel experiences at or near Murdoch University.",
      placeholder: "Share your stories, favorite destinations, or travel tips for fellow international students...",
      required: false
    }
  ]
};

export const PARTICIPANT_INFO_SHEET = {
  title: "Participant Information Sheet",
  content: `
**Study Title:** Travel Habits of International Students at Murdoch University

**Researcher:** School of Business and Engineering, Murdoch University

**What is this study about?**
This survey aims to understand the travel habits, preferences, and patterns of international students studying at Murdoch University. Your responses will help us better understand how students balance their academic commitments with travel experiences during their time in Australia.

**Why have I been invited to participate?**
You have been invited because you are an international student currently enrolled at Murdoch University. Your experiences and opinions are valuable to this research.

**What will I be asked to do?**
You will be asked to complete a brief survey about your travel habits. The survey includes questions about:
- Frequency of travel
- Transportation preferences
- Travel destinations
- Budget considerations
- Travel companions and activities

The survey takes approximately 2-3 minutes to complete.

**Are there any risks?**
There are no known risks associated with participating in this study. All responses are anonymous and will only be used for academic research purposes.

**Do I have to participate?**
Participation in this study is entirely voluntary. You may withdraw at any time without penalty by closing your browser. However, once you submit your responses, your data cannot be withdrawn as it is anonymized.

**How will my information be kept confidential?**
All responses are collected anonymously. No personal identifying information will be collected or stored. Your IP address and device information are not linked to your responses.

**What will happen to the information I provide?**
Your responses will be aggregated with those of other participants and used in academic publications, presentations, and reports. No individual responses will be identified.

**What do I do if I have concerns about the study?**
If you have any questions or concerns about this research, please contact the research team through your course coordinator.

**Ethical clearance**
This study has been reviewed and approved by Murdoch University's Human Research Ethics Committee.

**Consent**
By completing and submitting this survey, you indicate that:
- You understand the information provided above
- You are at least 18 years of age
- You voluntarily agree to participate in this research

Thank you for your participation!

---
Murdoch University | Perth, Western Australia
  `.trim()
};

export default DEFAULT_SURVEY;
