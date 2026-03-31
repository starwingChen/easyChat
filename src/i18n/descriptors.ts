import type { MessageDescriptor } from 'react-intl';

import type { MessageId } from './messages/types';

export function createMessageDescriptor(id: MessageId): MessageDescriptor {
  return { id };
}
