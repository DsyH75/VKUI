import { API, FileInfo } from 'jscodeshift';
import { getImportInfo, renameProp } from '../../codemod-helpers';
import { JSCodeShiftOptions } from '../../types';

export const parser = 'tsx';

export default function transformer(file: FileInfo, api: API, options: JSCodeShiftOptions) {
  const { alias } = options;
  const j = api.jscodeshift;
  const source = j(file.source);
  const { localName } = getImportInfo(j, file, 'RichCell', alias);

  if (localName) {
    renameProp(j, source, localName, {
      subhead: 'overTitle',
      text: 'subtitle',
      caption: 'extraSubtitle',
    });
  }

  return source.toSource();
}