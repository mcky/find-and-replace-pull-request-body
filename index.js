import core from '@actions/core'
import { replacePullRequestBody } from './src/replace-pr-body'

export async function run() {
  try {
    const inputs = {
      githubToken: core.getInput('githubToken', { required: true }),
      prNumber: core.getInput('prNumber'),
      body: core.getInput('body'),
      find: core.getInput('find'),
      isHtmlCommentTag: core.getInput('isHtmlCommentTag').toLowerCase() === 'true',
      replace: core.getInput('replace'),
    }

    await replacePullRequestBody(inputs)
  } catch (e) {
    core.setFailed(e.message)
  }
}

run()
