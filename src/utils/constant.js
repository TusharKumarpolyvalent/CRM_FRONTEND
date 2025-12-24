export const statusOption = ['Not Qualified', 'Qualified', 'Connected', 'Not Connected'];

export const statusReasons = {
  'Not Qualified': [
    'Already connected',
    'Planned Postponed',
    'Not Interested',
    'Invalid number',
    'Wrong number',
    'Repeated number',
    'others',
  ],
  Qualified: ['Converted'],
  'Not Connected': ['No Answer', 'Voicemail', 'Busy'],
  'Connected':['Callback','Other','Already Purchase','Plan Postponed','language Barrier','Call Cut']
};
