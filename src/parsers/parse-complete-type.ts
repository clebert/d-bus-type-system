import {CompleteType} from '../parse';
import {StringCursor} from '../string-cursor';
import {parseBasicType} from './parse-basic-type';
import {parseContainerType} from './parse-container-type';

export function parseCompleteType(
  signatureCursor: StringCursor
): CompleteType | undefined {
  return parseBasicType(signatureCursor) ?? parseContainerType(signatureCursor);
}
