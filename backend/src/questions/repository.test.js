jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const db = require('../../config/database');
const {
  listByProjectForUser,
  findByIdForProjectAndUser,
} = require('./repository');

describe('questions repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists project questions with all supported filters in stable batch order', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'question-1',
          project_id: 'project-1',
          outline_item_id: 'item-1',
          batch_no: 2,
          position_in_batch: 1,
          question_type: 'multiple_choice',
          difficulty_level: 'medium',
          prompt: 'Prompt 1',
          options: ['A', 'B'],
          correct_answer: { value: 'A' },
          explanation: 'Because',
          generation_source: 'mock',
          status: 'active',
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
      ],
    });

    const questions = await listByProjectForUser({
      projectId: 'project-1',
      userId: 'user-1',
      outlineItemId: 'item-1',
      batchNo: 2,
      status: 'active',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY q.batch_no ASC, q.position_in_batch ASC, q.created_at ASC, q.id ASC'),
      ['project-1', 'user-1', 'item-1', 2, 'active']
    );
    expect(questions).toEqual([
      expect.objectContaining({
        id: 'question-1',
        batch_no: 2,
        position_in_batch: 1,
        status: 'active',
      }),
    ]);
  });

  test('gets one question in project and user scope', async () => {
    db.query.mockResolvedValue({
      rows: [
        {
          id: 'question-1',
          project_id: 'project-1',
          outline_item_id: 'item-1',
          batch_no: 1,
          position_in_batch: 1,
          question_type: 'multiple_choice',
          difficulty_level: 'medium',
          prompt: 'Prompt 1',
          options: ['A', 'B'],
          correct_answer: { value: 'A' },
          explanation: 'Because',
          generation_source: 'mock',
          status: 'active',
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
      ],
    });

    const question = await findByIdForProjectAndUser('question-1', 'project-1', 'user-1');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE q.id = $1 AND q.project_id = $2 AND p.user_id = $3'),
      ['question-1', 'project-1', 'user-1']
    );
    expect(question).toEqual(expect.objectContaining({ id: 'question-1', project_id: 'project-1' }));
  });
});
