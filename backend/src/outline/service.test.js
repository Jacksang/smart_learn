const service = require('./service');

describe('outline service', () => {
  test('prepareOutlineCreateInput validates nested outline payloads', () => {
    const result = service.prepareOutlineCreateInput({
      projectId: 'project-1',
      title: '  Biology Outline  ',
      items: [
        {
          title: 'Cell structure',
          children: [
            { title: 'Membrane', level: 2 },
          ],
        },
      ],
    });

    expect(result).toEqual({
      isValid: true,
      errors: [],
      projectId: 'project-1',
      title: 'Biology Outline',
      status: 'draft',
      items: [
        {
          clientKey: 'item-1',
          parentClientKey: null,
          level: 1,
          title: 'Cell structure',
          content: null,
          orderIndex: 0,
        },
        {
          clientKey: 'item-2',
          parentClientKey: 'item-1',
          level: 2,
          title: 'Membrane',
          content: null,
          orderIndex: 1,
        },
      ],
    });
  });

  test('prepareOutlineCreateInput reports validation errors for bad payloads', () => {
    const result = service.prepareOutlineCreateInput({
      projectId: '',
      title: ' ',
      status: 'archived',
      items: [{ title: '', level: 99, orderIndex: -1, children: {} }],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'projectId is required and must be a non-empty string',
      'title is required and must be a non-empty string',
      'status must be one of: draft, published',
      'items[0].title is required and must be a non-empty string',
      'items[0].level must be one of: 1, 2, 3, 4, 5',
      'items[0].orderIndex must be a non-negative integer',
      'items[0].children must be an array',
    ]);
  });

  test('buildOutlineItemsFromMaterials creates deterministic top-level items from active materials', () => {
    expect(service.buildOutlineItemsFromMaterials([
      {
        title: 'Chapter 1',
        extracted_text: '  Intro to cells  ',
        is_active: true,
      },
      {
        original_file_name: 'notes.md',
        raw_text: '  Raw fallback text  ',
      },
      {
        title: 'Archived',
        extracted_text: 'Should be ignored',
        is_active: false,
      },
    ])).toEqual([
      {
        title: 'Chapter 1',
        level: 1,
        content: 'Intro to cells',
      },
      {
        title: 'notes.md',
        level: 1,
        content: 'Raw fallback text',
      },
    ]);
  });

  test('buildNestedOutlineItems reconstructs a nested outline tree from flat rows', () => {
    expect(service.buildNestedOutlineItems([
      {
        id: 'item-1',
        parent_item_id: null,
        title: 'Root',
        order_index: 0,
      },
      {
        id: 'item-2',
        parent_item_id: 'item-1',
        title: 'Child',
        order_index: 1,
      },
      {
        id: 'item-3',
        parent_item_id: 'item-2',
        title: 'Grandchild',
        order_index: 2,
      },
    ])).toEqual([
      {
        id: 'item-1',
        parent_item_id: null,
        title: 'Root',
        order_index: 0,
        children: [
          {
            id: 'item-2',
            parent_item_id: 'item-1',
            title: 'Child',
            order_index: 1,
            children: [
              {
                id: 'item-3',
                parent_item_id: 'item-2',
                title: 'Grandchild',
                order_index: 2,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('getOutlineById returns outline metadata with nested items', async () => {
    const repository = {
      findByIdForUser: jest.fn().mockResolvedValue({ id: 'outline-1', project_id: 'project-1' }),
      findItemsByOutlineId: jest.fn().mockResolvedValue([
        { id: 'item-1', parent_item_id: null, title: 'Root', order_index: 0 },
        { id: 'item-2', parent_item_id: 'item-1', title: 'Child', order_index: 1 },
      ]),
    };

    await expect(service.getOutlineById(
      { outlineId: 'outline-1', userId: 'user-1' },
      { repository }
    )).resolves.toEqual({
      id: 'outline-1',
      project_id: 'project-1',
      outline_items: [
        {
          id: 'item-1',
          parent_item_id: null,
          title: 'Root',
          order_index: 0,
          children: [
            {
              id: 'item-2',
              parent_item_id: 'item-1',
              title: 'Child',
              order_index: 1,
              children: [],
            },
          ],
        },
      ],
    });
  });

  test('getOutlineByProject returns the current project outline with nested items', async () => {
    const repository = {
      findCurrentByProjectForUser: jest.fn().mockResolvedValue({ id: 'outline-1', project_id: 'project-1' }),
      findItemsByOutlineId: jest.fn().mockResolvedValue([
        { id: 'item-1', parent_item_id: null, title: 'Root', order_index: 0 },
      ]),
    };

    await expect(service.getOutlineByProject(
      { projectId: 'project-1', userId: 'user-1' },
      { repository }
    )).resolves.toEqual({
      id: 'outline-1',
      project_id: 'project-1',
      outline_items: [
        {
          id: 'item-1',
          parent_item_id: null,
          title: 'Root',
          order_index: 0,
          children: [],
        },
      ],
    });
  });

  test('refreshOutline replaces the current project outline items when materials change', async () => {
    const repository = {
      findCurrentByProjectForUser: jest.fn().mockResolvedValue({ id: 'outline-1' }),
      replaceOutlineItems: jest.fn().mockResolvedValue({ id: 'outline-1', status: 'draft' }),
    };
    const materialsRepository = {
      listByProjectForUser: jest.fn().mockResolvedValue([
        { title: 'Lesson 1', extracted_text: 'Basics' },
        { original_file_name: 'lesson-2.pdf', raw_text: 'Advanced topics' },
      ]),
    };
    const projectsRepository = {
      findByIdForUser: jest.fn().mockResolvedValue({ id: 'project-1' }),
    };

    const result = await service.refreshOutline(
      { projectId: 'project-1', userId: 'user-1', trigger: 'material_updated' },
      { repository, materialsRepository, projectsRepository }
    );

    expect(projectsRepository.findByIdForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(repository.findCurrentByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(materialsRepository.listByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(repository.replaceOutlineItems).toHaveBeenCalledWith('outline-1', [
      {
        clientKey: 'item-1',
        parentClientKey: null,
        level: 1,
        title: 'Lesson 1',
        content: 'Basics',
        orderIndex: 0,
      },
      {
        clientKey: 'item-2',
        parentClientKey: null,
        level: 1,
        title: 'lesson-2.pdf',
        content: 'Advanced topics',
        orderIndex: 1,
      },
    ]);
    expect(result).toEqual({ id: 'outline-1', status: 'draft' });
  });

  test('refreshOutline is a no-op when the project has no outline yet', async () => {
    const repository = {
      findCurrentByProjectForUser: jest.fn().mockResolvedValue(null),
      replaceOutlineItems: jest.fn(),
    };
    const materialsRepository = {
      listByProjectForUser: jest.fn(),
    };
    const projectsRepository = {
      findByIdForUser: jest.fn().mockResolvedValue({ id: 'project-1' }),
    };

    const result = await service.refreshOutline(
      { projectId: 'project-1', userId: 'user-1', trigger: 'material_created' },
      { repository, materialsRepository, projectsRepository }
    );

    expect(result).toBeNull();
    expect(materialsRepository.listByProjectForUser).not.toHaveBeenCalled();
    expect(repository.replaceOutlineItems).not.toHaveBeenCalled();
  });
});
