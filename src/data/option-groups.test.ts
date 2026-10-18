import { describe, it, expect } from 'vitest';
import { allOptions, getOptionsByCategory } from '@/data/ghostty-options';
import { categories } from '@/data/categories';
import { OPTION_GROUPS, groupOptions } from '@/data/option-groups';
import type { ConfigOption } from '@/lib/schema/types';

describe('OPTION_GROUPS', () => {
  it('places every option in exactly one group of its own category', () => {
    const placements = new Map<string, string[]>();
    for (const [category, groups] of Object.entries(OPTION_GROUPS)) {
      for (const group of groups) {
        for (const id of group.optionIds) {
          placements.set(id, [...(placements.get(id) ?? []), `${category}/${group.id}`]);
        }
      }
    }

    const misplaced = allOptions
      .map((option) => ({ id: option.id, at: placements.get(option.id) ?? [] }))
      .filter(({ at }) => at.length !== 1);
    expect(misplaced).toEqual([]);

    const wrongCategory = allOptions
      .filter((option) => !placements.get(option.id)?.[0].startsWith(`${option.category}/`))
      .map((option) => option.id);
    expect(wrongCategory).toEqual([]);
  });

  it('names only real options', () => {
    const known = new Set(allOptions.map((option) => option.id));
    const unknown = Object.values(OPTION_GROUPS)
      .flat()
      .flatMap((group) => group.optionIds)
      .filter((id) => !known.has(id));
    expect(unknown).toEqual([]);
  });

  it('covers every category with unique group ids', () => {
    expect(Object.keys(OPTION_GROUPS).sort()).toEqual(categories.map((c) => c.id).sort());
    for (const groups of Object.values(OPTION_GROUPS)) {
      const ids = groups.map((group) => group.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps short categories as a single group', () => {
    for (const category of categories) {
      if (getOptionsByCategory(category.id).length <= 8) {
        expect(OPTION_GROUPS[category.id], category.id).toHaveLength(1);
      }
    }
  });
});

describe('groupOptions', () => {
  it('orders options by group, then by their position in the group', () => {
    const groups = groupOptions('fonts', getOptionsByCategory('fonts'));
    expect(groups.map((group) => group.name)).toEqual([
      'Family & size',
      'Style overrides',
      'Features & variations',
      'Rendering',
    ]);
    expect(groups[0].options.map((option) => option.id)).toEqual([
      'font-family',
      'font-size',
      'font-style',
      'font-synthetic-style',
    ]);
  });

  it('drops groups with no visible options', () => {
    const visible = getOptionsByCategory('fonts').filter((option) => option.id === 'font-thicken');
    const groups = groupOptions('fonts', visible);
    expect(groups.map((group) => group.id)).toEqual(['rendering']);
    expect(groups[0].options.map((option) => option.id)).toEqual(['font-thicken']);
  });

  it('never loses an option missing from the table', () => {
    const stray = { ...getOptionsByCategory('cursor')[0], id: 'not-in-any-group' } as ConfigOption;
    const groups = groupOptions('cursor', [...getOptionsByCategory('cursor'), stray]);
    expect(groups.at(-1)).toMatchObject({ id: 'other', name: 'Other' });
    expect(groups.at(-1)?.options).toEqual([stray]);
  });
});
