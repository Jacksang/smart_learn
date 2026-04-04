jest.mock('../projects/repository', () => ({
  findByIdForUser: jest.fn(),
}));

jest.mock('../materials/repository', () => ({
  listByProjectForUser: jest.fn(),
  createMaterialForUser: jest.fn(),
  updateMaterialForUser: jest.fn(),
}));

jest.mock('./repository', () => ({
  createOutlineForUser: jest.fn(),
  findCurrentByProjectForUser: jest.fn(),
  findItemsByOutlineId: jest.fn(),
  replaceOutlineItems: jest.fn(),
}));

const outlineRepository = require('./repository');
const materialsRepository = require('../materials/repository');
const projectsRepository = require('../projects/repository');
const outlineController = require('./controller');
const materialsController = require('../materials/controller');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('outline generation flow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates an outline through controller + service with flattened nested items', async () => {
    const createdOutline = {
      id: 'outline-1',
      project_id: 'project-1',
      title: 'Biology outline',
      status: 'draft',
    };
    outlineRepository.createOutlineForUser.mockResolvedValue(createdOutline);

    const req = {
      user: { id: 'user-1' },
      body: {
        project_id: 'project-1',
        title: '  Biology outline  ',
        items: [
          {
            title: ' Unit 1 ',
            children: [
              {
                title: ' Cells ',
                content: '  Basic structure ',
              },
            ],
          },
        ],
      },
    };
    const res = createRes();
    const next = jest.fn();

    await outlineController.createOutline(req, res, next);

    expect(outlineRepository.createOutlineForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
      title: 'Biology outline',
      status: 'draft',
      items: [
        {
          clientKey: 'item-1',
          parentClientKey: null,
          level: 1,
          title: 'Unit 1',
          content: null,
          orderIndex: 0,
        },
        {
          clientKey: 'item-2',
          parentClientKey: 'item-1',
          level: 1,
          title: 'Cells',
          content: '  Basic structure ',
          orderIndex: 1,
        },
      ],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Outline created',
      outline: createdOutline,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('refreshes the current outline when a material update succeeds', async () => {
    const updatedMaterial = {
      id: 'material-1',
      project_id: 'project-1',
      source_kind: 'upload',
      material_type: 'pdf',
      title: 'Updated notes',
      weight: 1,
      is_active: true,
    };

    materialsRepository.updateMaterialForUser.mockResolvedValue(updatedMaterial);
    projectsRepository.findByIdForUser.mockResolvedValue({ id: 'project-1' });
    outlineRepository.findCurrentByProjectForUser.mockResolvedValue({ id: 'outline-1' });
    materialsRepository.listByProjectForUser.mockResolvedValue([
      {
        title: 'Updated notes',
        extracted_text: 'Fresh summary',
        is_active: true,
      },
      {
        original_file_name: 'appendix.md',
        raw_text: 'Reference details',
        is_active: true,
      },
    ]);
    outlineRepository.replaceOutlineItems.mockResolvedValue({
      id: 'outline-1',
      project_id: 'project-1',
      status: 'draft',
    });

    const req = {
      params: { materialId: 'material-1' },
      user: { id: 'user-1' },
      body: {
        title: 'Updated notes',
        extractedText: 'Fresh summary',
      },
    };
    const res = createRes();
    const next = jest.fn();

    await materialsController.updateMaterial(req, res, next);

    expect(materialsRepository.updateMaterialForUser).toHaveBeenCalledWith('material-1', 'user-1', {
      title: 'Updated notes',
      extracted_text: 'Fresh summary',
    });
    expect(projectsRepository.findByIdForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(outlineRepository.findCurrentByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(materialsRepository.listByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(outlineRepository.replaceOutlineItems).toHaveBeenCalledWith('outline-1', [
      {
        clientKey: 'item-1',
        parentClientKey: null,
        level: 1,
        title: 'Updated notes',
        content: 'Fresh summary',
        orderIndex: 0,
      },
      {
        clientKey: 'item-2',
        parentClientKey: null,
        level: 1,
        title: 'appendix.md',
        content: 'Reference details',
        orderIndex: 1,
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Material updated',
      material: {
        ...updatedMaterial,
        weight: 1,
        priority: 'normal',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('retrieves a project outline with nested outline_items tree', async () => {
    outlineRepository.findCurrentByProjectForUser.mockResolvedValue({
      id: 'outline-1',
      project_id: 'project-1',
      title: 'Biology outline',
      status: 'draft',
    });
    outlineRepository.findItemsByOutlineId.mockResolvedValue([
      {
        id: 'item-1',
        outline_id: 'outline-1',
        parent_item_id: null,
        level: 1,
        title: 'Unit 1',
        content: null,
        order_index: 0,
      },
      {
        id: 'item-2',
        outline_id: 'outline-1',
        parent_item_id: 'item-1',
        level: 2,
        title: 'Cells',
        content: 'Structure',
        order_index: 1,
      },
      {
        id: 'item-3',
        outline_id: 'outline-1',
        parent_item_id: 'item-2',
        level: 3,
        title: 'Membrane',
        content: 'Functions',
        order_index: 2,
      },
    ]);

    const req = {
      params: { projectId: 'project-1' },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await outlineController.getOutlineByProject(req, res, next);

    expect(outlineRepository.findCurrentByProjectForUser).toHaveBeenCalledWith('project-1', 'user-1');
    expect(outlineRepository.findItemsByOutlineId).toHaveBeenCalledWith('outline-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      outline: {
        id: 'outline-1',
        project_id: 'project-1',
        title: 'Biology outline',
        status: 'draft',
        outline_items: [
          {
            id: 'item-1',
            outline_id: 'outline-1',
            parent_item_id: null,
            level: 1,
            title: 'Unit 1',
            content: null,
            order_index: 0,
            children: [
              {
                id: 'item-2',
                outline_id: 'outline-1',
                parent_item_id: 'item-1',
                level: 2,
                title: 'Cells',
                content: 'Structure',
                order_index: 1,
                children: [
                  {
                    id: 'item-3',
                    outline_id: 'outline-1',
                    parent_item_id: 'item-2',
                    level: 3,
                    title: 'Membrane',
                    content: 'Functions',
                    order_index: 2,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
