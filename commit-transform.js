const emojiMap = {
    feat: '✨',
    fix: '🐛',
    docs: '📝',
    style: '💄',
    refactor: '♻️',
    perf: '⚡️',
    test: '✅',
    build: '📦️',
    ci: '👷',
    chore: '🔨',
    revert: '⏪️'
  };
  
  module.exports = {
    prompter: (cz, commit) => {
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select the type of change that you\'re committing:',
          choices: Object.keys(emojiMap).map(type => ({
            name: `${type}: ${emojiMap[type]} ${type}`,
            value: type
          }))
        },
        {
          type: 'input',
          name: 'scope',
          message: 'What is the scope of this change (e.g. component or file name): (press enter to skip)'
        },
        {
          type: 'input',
          name: 'subject',
          message: 'Write a short, imperative tense description of the change:'
        },
        {
          type: 'input',
          name: 'body',
          message: 'Provide a longer description of the change: (press enter to skip)'
        },
        {
          type: 'confirm',
          name: 'breaking',
          message: 'Are there any breaking changes?',
          default: false
        },
        {
          type: 'input',
          name: 'breakingBody',
          default: '',
          message: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself:',
          when: answers => answers.breaking
        },
        {
          type: 'input',
          name: 'issues',
          message: 'Does this change affect any open issues? (press enter to skip)'
        }
      ]).then(answers => {
        const scope = answers.scope ? `(${answers.scope})` : '';
        const emoji = emojiMap[answers.type];
        const head = `${answers.type}${scope}: ${emoji} ${answers.subject}`;
        const body = answers.body ? answers.body : '';
        const breaking = answers.breaking ? `BREAKING CHANGE: ${answers.breakingBody}\n` : '';
        const issues = answers.issues ? answers.issues : '';
  
        commit(`${head}\n\n${body}\n\n${breaking}${issues}`);
      });
    }
  };