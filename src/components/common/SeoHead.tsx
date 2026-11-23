import React from 'react';
import { useSeoHead, type SeoHeadConfig } from '../../utils/seoHead.ts';

export interface SeoHeadProps extends SeoHeadConfig {}

export const SeoHead: React.FC<SeoHeadProps> = (props) => {
  useSeoHead(props);
  return null;
};

export default SeoHead;
