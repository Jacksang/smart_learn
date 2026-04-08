const {
  MILESTONE_DEFINITIONS,
  getAllMilestones,
  checkAndAwardMilestones,
  getMilestoneById,
  getMilestonesByCategory,
  getMilestoneProgress,
  getMilestoneProgressReport
} = require('./milestones');

describe('Milestone System - Definitions', () => {
  test('should have all four milestone categories', () => {
    const categories = Object.keys(MILESTONE_DEFINITIONS);
    expect(categories).toEqual([
      'effort',
      'focus',
      'resilience',
      'improvement'
    ]);
  });

  test('should have milestones in each category', () => {
    Object.entries(MILESTONE_DEFINITIONS).forEach(([category, milestones]) => {
      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);
    });
  });

  test('each milestone should have required properties', () => {
    Object.entries(MILESTONE_DEFINITIONS).forEach(([category, milestones]) => {
      milestones.forEach(milestone => {
        expect(milestone.id).toBeDefined();
        expect(milestone.displayName).toBeDefined();
        expect(milestone.description).toBeDefined();
        expect(milestone.category).toBe(category);
        expect(milestone.icon).toBeDefined();
        expect(typeof milestone.checkFunction).toBe('function');
      });
    });
  });
});

describe('Milestone System - Queries', () => {
  test('getAllMilestones should return all milestones', () => {
    const all = getAllMilestones();
    expect(Object.keys(all).length).toBe(4);
    
    Object.values(all).forEach(category => {
      expect(Array.isArray(category)).toBe(true);
      expect(category.length).toBeGreaterThan(0);
    });
  });

  test('getMilestoneById should find existing milestone', () => {
    const milestone = getMilestoneById('first_try');
    expect(milestone).not.toBeNull();
    expect(milestone.id).toBe('first_try');
    expect(milestone.category).toBe('effort');
  });

  test('getMilestoneById should return null for non-existent milestone', () => {
    const milestone = getMilestoneById('non_existent_milestone');
    expect(milestone).toBeNull();
  });

  test('getMilestonesByCategory should return correct category', () => {
    const effortMilestones = getMilestonesByCategory('effort');
    expect(effortMilestones.every(m => m.category === 'effort')).toBe(true);
    
    const focusMilestones = getMilestonesByCategory('focus');
    expect(focusMilestones.every(m => m.category === 'focus')).toBe(true);
  });

  test('getMilestonesByCategory should return empty array for invalid category', () => {
    const milestones = getMilestonesByCategory('invalid');
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones.length).toBe(0);
  });
});

describe('Milestone System - Awarding', () => {
  const baseMetrics = {
    totalAttempts: 25,
    totalTime: 1800,
    sessionCount: 10,
    longestSession: 540,
    recoveries: 5,
    topicsMastered: 3
  };

  test('checkAndAwardMilestones should award milestones that match criteria', () => {
    const alreadyAchieved = [];
    const toAward = checkAndAwardMilestones(baseMetrics, alreadyAchieved);
    
    // Should award at least first_try (effort)
    const firstTryAwarded = toAward.some(m => m.id === 'first_try');
    expect(firstTryAwarded).toBe(true);
    
    // Should award half_hour (effort)
    const halfHourAwarded = toAward.some(m => m.id === 'half_hour');
    expect(halfHourAwarded).toBe(true);
  });

  test('checkAndAwardMilestones should not award already achieved milestones', () => {
    const alreadyAchieved = ['first_try', 'half_hour'];
    const toAward = checkAndAwardMilestones(baseMetrics, alreadyAchieved);
    
    const firstTryAwarded = toAward.some(m => m.id === 'first_try');
    const halfHourAwarded = toAward.some(m => m.id === 'half_hour');
    
    expect(firstTryAwarded).toBe(false);
    expect(halfHourAwarded).toBe(false);
  });

  test('checkAndAwardMilestones should award different milestones for different metrics', () => {
    const lowMetrics = {
      totalAttempts: 1,
      totalTime: 600,
      sessionCount: 1,
      longestSession: 300,
      recoveries: 1,
      topicsMastered: 1
    };
    
    const highMetrics = {
      totalAttempts: 200,
      totalTime: 20000,
      sessionCount: 50,
      longestSession: 5400,
      recoveries: 35,
      topicsMastered: 55
    };
    
    const lowToAward = checkAndAwardMilestones(lowMetrics, []);
    const highToAward = checkAndAwardMilestones(highMetrics, []);
    
    // High metrics should award more milestones
    expect(highToAward.length).toBeGreaterThan(lowToAward.length);
    
    // High metrics should award expert milestones
    const expertAwarded = highToAward.some(m => m.id === 'expert_path');
    expect(expertAwarded).toBe(true);
  });

  test('checkAndAwardMilestones should handle zero metrics', () => {
    const zeroMetrics = {
      totalAttempts: 0,
      totalTime: 0,
      sessionCount: 0,
      longestSession: 0,
      recoveries: 0,
      topicsMastered: 0
    };
    
    const toAward = checkAndAwardMilestones(zeroMetrics, []);
    // Should not award anything
    expect(toAward.length).toBe(0);
  });
});

describe('Milestone System - Progress', () => {
  test('getMilestoneProgress should return 0 for non-existent milestone', () => {
    const progress = getMilestoneProgress({}, 'non_existent');
    expect(progress).toBe(0);
  });

  test('getMilestoneProgress should return 0 for milestone far from threshold', () => {
    const metrics = { totalTime: 0, totalAttempts: 0 };
    const progress = getMilestoneProgress(metrics, 'five_hours');
    expect(progress).toBe(0);
  });

  test('getMilestoneProgress should return 1 for milestone above threshold', () => {
    const metrics = { totalTime: 20000, totalAttempts: 200 };
    const progress = getMilestoneProgress(metrics, 'first_try');
    expect(progress).toBeCloseTo(1.0, 1);
  });

  test('getMilestoneProgress should return value between 0 and 1', () => {
    const metrics = { totalTime: 1000, totalAttempts: 50 };
    const progress = getMilestoneProgress(metrics, 'ten_minutes');
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(1);
  });
});

describe('Milestone System - Progress Report', () => {
  const metrics = {
    totalAttempts: 50,
    totalTime: 5000,
    sessionCount: 15,
    longestSession: 3600,
    recoveries: 12,
    topicsMastered: 8
  };

  test('getMilestoneProgressReport should return achieved milestones', () => {
    const achieved = ['first_try', 'half_hour', 'momentum'];
    const report = getMilestoneProgressReport(metrics, achieved);
    
    expect(report.achieved.length).toBeGreaterThan(0);
    expect(report.achieved.every(m => achieved.includes(m.id))).toBe(true);
  });

  test('getMilestoneProgressReport should return locked milestones with progress', () => {
    const achieved = ['first_try'];
    const report = getMilestoneProgressReport(metrics, achieved);
    
    expect(report.locked.length).toBeGreaterThan(0);
    expect(report.locked.every(m => m.progress > 0 && m.progress < 1)).toBe(true);
  });

  test('getMilestoneProgressReport should have achieved milestones sorted', () => {
    const achieved = ['first_try', 'half_hour', 'momentum'];
    const report = getMilestoneProgressReport(metrics, achieved);
    
    // Should have achieved milestones
    expect(report.achieved.length).toBe(3);
    
    // Should include all requested milestones
    const achievedIds = report.achieved.map(m => m.id);
    expect(achievedIds).toEqual(achieved);
  });

  test('getMilestoneProgressReport should include recentlyAchieved field', () => {
    const achieved = ['first_try'];
    const report = getMilestoneProgressReport(metrics, achieved);
    
    expect(report).toHaveProperty('recentlyAchieved');
    expect(Array.isArray(report.recentlyAchieved)).toBe(true);
  });
});

describe('Milestone System - Edge Cases', () => {
  test('should handle milestones at exact thresholds', () => {
    const exactMetrics = {
      totalAttempts: 3,
      totalTime: 1800,
      sessionCount: 3,
      longestSession: 1800,
      recoveries: 3,
      topicsMastered: 3
    };
    
    const toAward = checkAndAwardMilestones(exactMetrics, []);
    // Should award milestones at exactly 3
    expect(toAward.length).toBeGreaterThan(0);
  });

  test('should handle milestones just below thresholds', () => {
    const justBelowMetrics = {
      totalAttempts: 2,
      totalTime: 1799,
      sessionCount: 2,
      longestSession: 1799,
      recoveries: 2,
      topicsMastered: 2
    };
    
    const toAward = checkAndAwardMilestones(justBelowMetrics, []);
    // Should not award milestones at threshold of 3
    const milestonesNeeding3 = toAward.filter(m => 
      m.id === 'first_try' || m.id === 'session_starter'
    );
    expect(milestonesNeeding3.length).toBeLessThan(1);
  });

  test('should handle milestones just above thresholds', () => {
    const justAboveMetrics = {
      totalAttempts: 4,
      totalTime: 1801,
      sessionCount: 4,
      longestSession: 1801,
      recoveries: 4,
      topicsMastered: 4
    };
    
    const toAward = checkAndAwardMilestones(justAboveMetrics, []);
    // Should award milestones just above threshold
    expect(toAward.length).toBeGreaterThan(0);
  });

  test('should handle very large metrics values', () => {
    const hugeMetrics = {
      totalAttempts: 1000,
      totalTime: 100000,
      sessionCount: 100,
      longestSession: 36000,
      recoveries: 100,
      topicsMastered: 100
    };
    
    const toAward = checkAndAwardMilestones(hugeMetrics, []);
    // Should award all possible milestones
    expect(toAward.length).toBeGreaterThan(10);
  });
});
