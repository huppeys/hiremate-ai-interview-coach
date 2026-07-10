// mocks/mockLLMResponse.js
//
// Mock AI responses for automated testing.
// Use these instead of real API calls in test environments.

const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "Tell me about a time when you had to learn a new technology quickly. How did you approach it?",
    type: "behavioral",
    difficulty: "easy",
    tips: "Use the STAR method: Situation, Task, Action, Result. Focus on your learning process and outcome.",
  },
  {
    id: "q2",
    question: "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    type: "behavioral",
    difficulty: "medium",
    tips: "Focus on communication and conflict resolution skills. Show empathy and professionalism.",
  },
  {
    id: "q3",
    question: "Give me an example of a time when you had to meet a tight deadline. What did you do?",
    type: "behavioral",
    difficulty: "easy",
    tips: "Demonstrate time management and prioritization skills. Mention specific tools or strategies used.",
  },
  {
    id: "q4",
    question: "Tell me about a project where you took initiative and went beyond what was required.",
    type: "behavioral",
    difficulty: "medium",
    tips: "Highlight your proactive attitude and passion. Show the impact of your initiative.",
  },
  {
    id: "q5",
    question: "Describe a time when you received critical feedback. How did you respond?",
    type: "behavioral",
    difficulty: "medium",
    tips: "Show that you are coachable and open to feedback. Mention specific improvements you made.",
  },
  {
    id: "q6",
    question: "Tell me about a time when you had to make a decision with incomplete information.",
    type: "behavioral",
    difficulty: "hard",
    tips: "Demonstrate analytical thinking and risk assessment. Show how you gathered what info was available.",
  },
  {
    id: "q7",
    question: "Describe a situation where you had to explain a complex concept to a non-technical audience.",
    type: "behavioral",
    difficulty: "medium",
    tips: "Focus on communication skills. Mention analogies or visual aids you used to simplify the concept.",
  },
  {
    id: "q8",
    question: "Tell me about a time when a project failed. What did you learn from it?",
    type: "behavioral",
    difficulty: "hard",
    tips: "Be honest about the failure. Focus heavily on what you learned and what you would do differently.",
  },
];

const MOCK_FOLLOW_UP = "Can you tell me more about the specific actions you took and what the measurable outcome was?";

const MOCK_NO_FOLLOW_UP = null;

const MOCK_FEEDBACK = {
  contentScore: 7,
  starScore: 6,
  clarityScore: 8,
  confidenceScore: 7,
  fillerWords: [
    { word: "um", count: 2 },
    { word: "like", count: 1 },
  ],
  tip: "Try to be more specific about the measurable results of your actions using numbers or percentages.",
};

module.exports = {
  MOCK_QUESTIONS,
  MOCK_FOLLOW_UP,
  MOCK_NO_FOLLOW_UP,
  MOCK_FEEDBACK,
};
