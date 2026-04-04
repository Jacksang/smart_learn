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
});
