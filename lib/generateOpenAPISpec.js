
export const conversionOptions = {
  filterStandardHeaders: true,
  attemptToParameterizeUrl: true,
  tags: ['posts', 'authors', 'tags', 'pages', 'tiers', 'settings'],
  
pathReplace: {
    '[a-zA-Z0-9]{24}': 'id',
}
    
 
  
};
