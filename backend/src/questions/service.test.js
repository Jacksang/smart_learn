const service = require('./service');

describe('questions service', () => {
  test('loadGenerationContext resolves the current project, outline, and target outline item', async () => {
    const projectsRepository = {
      findByIdForUser: jest.fn().mockResolvedValue({ id: 'project-1', subject: 'Biology' }),
    };
    const outlineRepository = {
      findCurrentByProjectForUser: jest.fn().mockResolvedValue({ id: 'outline-1', title: 'Cells outline' }),
      findItemsByOutlineId: jest.fn().mockResolvedValue([
        { id: 'item-1', parent_item_id: null, title: 'Cells', content: 'Intro', order_index: 0 },
        { id: 'item-2', parent_item_id: 'item-1', title: 'Membrane', content: 'Cell membrane structure', order_index: 1 },
      ]),
    };

    await expect(service.loadGenerationContext(
      { projectId: 'project-1', userId: 'user-1', outlineItemId: 'item-2' },
      { projectsRepository, outlineRepository }
    )).resolves.toEqual({
      project: { id: 'project-1', subject: 'Biology' },
      outline: { id: 'outline-1', title: 'Cells outline' },
      outlineItem: { id: 'item-2', parent_item_id: 'item-1', title: 'Membrane', content: 'Cell membrane structure', order_index: 1 },
      outlineItems: [
        { id: 'item-1', parent_item_id: null, title: 'Cells', content: 'Intro', order_index: 0 },
        { id: 'item-2', parent_item_id: 'item-1', title: 'Membrane', content: 'Cell membrane structure', order_index: 1 },
      ],
      outlinePath: ['Cells', 'Membrane'],
    });
  });

  test('generateQuestionBatch creates deterministic questions from outline item content with requested controls', async () => {
    const projectsRepository = {
      findByIdForUser: jest.fn().mockResolvedValue({ id: 'project-1', subject: 'Biology' }),
    };
    const outlineRepository = {
      findCurrentByProjectForUser: jest.fn().mockResolvedValue({ id: 'outline-1', title: 'Cells outline' }),
      findItemsByOutlineId: jest.fn().mockResolvedValue([
        { id: 'item-1', parent_item_id: null, title: 'Cells', content: 'Overview of cells', order_index: 0 },
        { id: 'item-2', parent_item_id: 'item-1', title: 'Membrane', content: 'The membrane controls movement of materials in and out of the cell.', order_index: 1 },
      ]),
    };

    const result = await service.generateQuestionBatch(
      {
        projectId: 'project-1',
        userId: 'user-1',
        outlineItemId: 'item-2',
        batchNo: 3,
        batchSize: 3,
        difficultyLevel: 'hard',
        questionTypes: ['multiple_choice', 'short_answer', 'true_false'],
      },
      { projectsRepository, outlineRepository }
    );

    expect(result.project.id).toBe('project-1');
    expect(result.outlineItem.id).toBe('item-2');
    expect(result.outlinePath).toEqual(['Cells', 'Membrane']);
    expect(result.questions).toHaveLength(3);
    expect(result.questions).toEqual([
      expect.objectContaining({
        project_id: 'project-1',
        outline_item_id: 'item-2',
        batch_no: 3,
        position_in_batch: 1,
        question_type: 'multiple_choice',
        difficulty_level: 'hard',
        generation_source: 'mock_outline_mvp',
        status: 'active',
      }),
      expect.objectContaining({
        project_id: 'project-1',
        outline_item_id: 'item-2',
        batch_no: 3,
        position_in_batch: 2,
        question_type: 'short_answer',
        difficulty_level: 'hard',
        options: null,
      }),
      expect.objectContaining({
        project_id: 'project-1',
        outline_item_id: 'item-2',
        batch_no: 3,
        position_in_batch: 3,
        question_type: 'true_false',
        difficulty_level: 'hard',
        options: ['True', 'False'],
      }),
    ]);
    expect(result.questions[0].prompt).toContain('Cells > Membrane');
    expect(result.questions[0].options).toHaveLength(4);
    expect(result.questions[1].correct_answer).toEqual(expect.objectContaining({
      value: 'Membrane',
    }));
    expect(result.questions[2].correct_answer).toEqual({ value: 'True' });
  });

  test('generateQuestionBatch rejects unsupported difficulty levels and question types', async () => {
    await expect(service.generateQuestionBatch({
      projectId: 'project-1',
      userId: 'user-1',
      outlineItemId: 'item-1',
      difficultyLevel: 'expert',
    }, {
      projectsRepository: { findByIdForUser: jest.fn() },
      outlineRepository: { findCurrentByProjectForUser: jest.fn(), findItemsByOutlineId: jest.fn() },
    })).rejects.toMatchObject({
      code: 'INVALID_DIFFICULTY_LEVEL',
      status: 422,
    });

    await expect(service.generateQuestionBatch({
      projectId: 'project-1',
      userId: 'user-1',
      outlineItemId: 'item-1',
      questionTypes: ['essay'],
    }, {
      projectsRepository: { findByIdForUser: jest.fn() },
      outlineRepository: { findCurrentByProjectForUser: jest.fn(), findItemsByOutlineId: jest.fn() },
    })).rejects.toMatchObject({
      code: 'INVALID_QUESTION_TYPES',
      status: 422,
    });
  });
});
