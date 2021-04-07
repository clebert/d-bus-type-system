import {CompleteType} from '../parse';
import {StringReader} from '../string-reader';
import {parseBasicType} from './parse-basic-type';
import {parseContainerType} from './parse-container-type';

export function parseCompleteType(
  signature: StringReader
): CompleteType | undefined {
  return parseBasicType(signature) ?? parseContainerType(signature);
}
