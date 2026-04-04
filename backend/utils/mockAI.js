/**
 * Mock AI Service for Quiz Generation
 * This service provides mock responses until real AI integration is ready
 */

exports.generateQuestionsFromOutline = async (outline, count = 5) => {
  console.log(`🤖 [MOCK AI] Generating ${count} questions for outline: ${outline.courseTitle}`);
  
  const questions = [];
  const topics = outline.topics || [];
  
  for (let i = 0; i < count && i < topics.length; i++) {
    const topic = topics[i] || { title: 'General Topic', description: '' };
    
    questions.push({
      user: null,
      outline: null,
      topic: topic.title,
      type: 'single-choice',
      difficulty: 'medium',
      prompt: `What is ${topic.title} and why is it important?`,
      options: [
        `A detailed explanation of ${topic.title}`,
        `An alternative explanation`,
        `A common misconception`,
        `Another perspective`
      ],
      correctAnswer: 0,
      explanation: 'This is the correct answer for this question.',
      source: 'ai-generated',
      tags: ['demo'],
    });
  }
  
  return questions;
};

exports.generateSummary = async (text) => {
  console.log(`🤖 [MOCK AI] Generating summary for ${text.slice(0, 50)}...`);
  return `This is a mock summary of: ${text?.slice(0, 100) || ''}`;
};

exports.extractKeyPoints = async (text) => {
  console.log(`🤖 [MOCK AI] Extracting key points from content...`);
  return ['This is a mock key point', 'Another point extracted', 'Third point found'];
};

exports.recommendPracticeQuestions = async (userScore, topic) => {
  console.log(`🤖 [MOCK AI] Recommending practice questions...`);
  return [
    'Practice question 1',
    'Practice question 2',
    'Practice question 3',
  ];
};
