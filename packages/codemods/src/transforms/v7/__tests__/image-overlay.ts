jest.autoMockOff();
import { defineSnapshotTestFromFixture } from '../../../testHelpers/testHelper';

const name = 'image-overlay';
const fixtures = ['image', 'image-base'] as const;

describe(name, () => {
  fixtures.forEach((test) =>
    defineSnapshotTestFromFixture(__dirname, name, global.TRANSFORM_OPTIONS, `${name}/${test}`),
  );
});
