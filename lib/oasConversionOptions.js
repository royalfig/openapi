import {additionalOasData} from './data.js';

export const conversionOptions = {
    filterStandardHeaders: true,
    attemptToParameterizeUrl: true,
    tags: [...additionalOasData.keys()]
};
