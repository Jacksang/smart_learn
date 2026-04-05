jest.mock('../../config/database', () => ({
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

const db = require('../../config/database');
const questionsController = require('./controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createQueryRouter() {
  return async (text, params) => {
    if (text.includes('FROM learning_projects') && text.includes('WHERE id = $1 AND user_id = $2')) {
      return {
        rows: [
          {
            id: 'project-1',
            user_id: 'user-1',
            title: 'Biology review',
            description: 'Midterm prep',
            subject: 'Biology',
            status: 'active',
            current_mode: 'study',
            current_outline_id: 'outline-1',
            created_at: '2026-04-05T00:00:00Z',
            updated_at: '2026-04-05T00:00:00Z',
          },
        ],
      };
    }

    if (text.includes('FROM outlines o') && text.includes('ORDER BY CASE WHEN p.current_outline_id = o.id THEN 0 ELSE 1 END')) {
      return {
        rows: [
          {
            id: 'outline-1',
            project_id: 'project-1',
            title: 'Biology outline',
            status: 'draft',
            created_at: '2026-04-05T00:00:00Z',
            updated_at: '2026-04-05T00:00:00Z',
          },
        ],
      };
    }

    if (text.includes('FROM outline_items') && text.includes('WHERE outline_id = $1')) {
      return {
        rows: [
          {
            id: 'item-parent',
            outline_id: 'outline-1',
            parent_item_id: null,
            level: 1,
            title: 'Unit 1',
            content: 'Core foundations',
            order_index: 0,
            created_at: '2026-04-05T00:00:00Z',
          },
          {
            id: 'item-1',
            outline_id: 'outline-1',
            parent_item_id: 'item-parent',
            level: 2,
            title: 'Cells',
            content: 'Cells are the basic structural and functional unit of life.',
            order_index: 1,
            created_at: '2026-04-05T00:00:00Z',
          },
        ],
      };
    }

    if (text.includes('SELECT COALESCE(MAX(batch_no), 0) AS max_batch_no')) {
      const [projectId, outlineItemId] = params;
      if (projectId === 'project-1' && outlineItemId === 'item-1') {
        return { rows: [{ max_batch_no: 1 }] };
      }
      return { rows: [{ max_batch_no: 0 }] };
    }

    if (text.includes('INSERT INTO questions')) {
      const batchNo = params[2];
      const batchSize = params.length / 12;
      return {
        rows: Array.from({ length: batchSize }, (_, index) => ({
          id: `question-${batchNo}-${index + 1}`,
          project_id: params[index * 12],
          outline_item_id: params[index * 12 + 1],
          batch_no: params[index * 12 + 2],
          position_in_batch: params[index * 12 + 3],
          question_type: params[index * 12 + 4],
          difficulty_level: params[index * 12 + 5],
          prompt: params[index * 12 + 6],
          options: JSON.parse(params[index * 12 + 7]),
          correct_answer: JSON.parse(params[index * 12 + 8]),
          explanation: params[index * 12 + 9],
          generation_source: params[index * 12 + 10],
          status: params[index * 12 + 11],
          created_at: `2026-04-05T00:00:0${index}Z`,
          updated_at: `2026-04-05T00:00:0${index}Z`,
        })),
      };
    }

    if (text.includes('FROM questions q') && text.includes('ORDER BY q.batch_no ASC, q.position_in_batch ASC, q.created_at ASC, q.id ASC')) {
      return {
        rows: [
          {
            id: 'question-1-1',
            project_id: 'project-1',
            outline_item_id: 'item-1',
            batch_no: 1,
            position_in_batch: 1,
            question_type: 'multiple_choice',
            difficulty_level: 'medium',
            prompt: 'Question 1: Which concept best matches Unit 1 > Cells?',
            options: ['Cells', 'Biology', 'Biology outline', 'Background concept'],
            correct_answer: { value: 'Cells' },
            explanation: 'Because',
            generation_source: 'mock_outline_mvp',
            status: 'active',
            created_at: '2026-04-05T00:00:00Z',
            updated_at: '2026-04-05T00:00:00Z',
          },
          {
            id: 'question-1-2',
            project_id: 'project-1',
            outline_item_id: 'item-1',
            batch_no: 1,
            position_in_batch: 2,
            question_type: 'multiple_choice',
            difficulty_level: 'medium',
            prompt: 'Question 2: Which concept best matches Unit 1 > Cells?',
            options: ['Cells', 'Biology', 'Biology outline', 'Background concept'],
            correct_answer: { value: 'Cells' },
            explanation: 'Because',
            generation_source: 'mock_outline_mvp',
            status: 'active',
            created_at: '2026-04-05T00:00:01Z',
            updated_at: '2026-04-05T00:00:01Z',
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${text} :: ${JSON.stringify(params)}`);
  };
}

describe('question generation flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockImplementation(createQueryRouter());
  });

  test('generates the first batch with the default 5-question size from the outline item context', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: { outlineItemId: 'item-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await questionsController.generateProjectQuestions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Question batch generated',
        projectId: 'project-1',
        outlineItemId: 'item-1',
        batchNo: 1,
        batchSize: 5,
        questions: expect.arrayContaining([
          expect.objectContaining({
            project_id: 'project-1',
            outline_item_id: 'item-1',
            batch_no: 1,
            position_in_batch: 1,
            question_type: 'multiple_choice',
            difficulty_level: 'medium',
            generation_source: 'mock_outline_mvp',
            status: 'active',
          }),
        ]),
      })
    );

    const insertCall = db.query.mock.calls.find(([text]) => text.includes('INSERT INTO questions'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).toHaveLength(60);
    expect(insertCall[1][2]).toBe(1);
    expect(insertCall[1][3]).toBe(1);
    expect(insertCall[1][14]).toBe(1);
    expect(insertCall[1][15]).toBe(2);
    expect(next).not.toHaveBeenCalled();
  });

  test('generates the next batch with the next batch number and preserves the default batch size', async () => {
    const req = {
      params: { projectId: 'project-1' },
      body: { outlineItemId: 'item-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await questionsController.generateNextProjectQuestionBatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        outlineItemId: 'item-1',
        batchNo: 2,
        batchSize: 5,
      })
    );

    const maxBatchQuery = db.query.mock.calls.find(([text]) => text.includes('SELECT COALESCE(MAX(batch_no), 0) AS max_batch_no'));
    expect(maxBatchQuery[1]).toEqual(['project-1', 'item-1']);

    const insertCall = db.query.mock.calls.findLast(([text]) => text.includes('INSERT INTO questions'));
    expect(insertCall[1][2]).toBe(2);
    expect(insertCall[1]).toHaveLength(60);
    expect(next).not.toHaveBeenCalled();
  });

  test('lists project questions with normalized project filters in stable batch order', async () => {
    const req = {
      params: { projectId: 'project-1' },
      query: {
        outline_item_id: ' item-1 ',
        batch_no: '1',
        status: ' active ',
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await questionsController.listProjectQuestions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      questions: [
        expect.objectContaining({ id: 'question-1-1', batch_no: 1, position_in_batch: 1 }),
        expect.objectContaining({ id: 'question-1-2', batch_no: 1, position_in_batch: 2 }),
      ],
    });

    const listCall = db.query.mock.calls.find(([text]) => text.includes('FROM questions q') && text.includes('ORDER BY q.batch_no ASC, q.position_in_batch ASC, q.created_at ASC, q.id ASC'));
    expect(listCall[1]).toEqual(['project-1', 'user-1', 'item-1', 1, 'active']);
    expect(next).not.toHaveBeenCalled();
  });
});
