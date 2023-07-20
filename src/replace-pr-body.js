import github from '@actions/github'

export async function replacePullRequestBody(inputs) {
  const { context } = github
  const octokit = github.getOctokit(inputs.githubToken)

  validateInputs(context, inputs)

  const pullRequest = await getPullRequestDetails(context, inputs.prNumber, octokit)

  if (!inputs.body.length && !pullRequest.body) {
    throw new Error(
      'Pull request body is empty. There is nothing to `find` and `replace`.\n' +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  const nextPullRequestBody = getNextPullRequestBody(pullRequest, inputs)

  await octokit.rest.pulls.update({
    ...context.repo,
    pull_number: pullRequest.number,
    body: nextPullRequestBody,
  })
}

function validateInputs(context, inputs) {
  if (!inputs.githubToken.length) {
    throw new Error(
      'You forgot to set `githubToken` input.\n' +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  if (!inputs.body.length && (!inputs.find.length || !inputs.replace.length)) {
    throw new Error(
      'You must either set `body` input or both `find` and `replace` inputs.\n' +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  if (inputs.body.length && (inputs.find.length || inputs.replace.length)) {
    throw new Error(
      "You can't use `body` input while setting `find` and `replace` ones.\n" +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  if (inputs.isHtmlCommentTag && !inputs.find.length) {
    throw new Error(
      "You can't set set `isHtmlCommentTag` input to `true` without also setting `find` input.\n" +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  if (!context.payload.pull_request && !inputs.prNumber) {
    throw new Error(
      'You must either trigger this action from a pull request, or manually set the `prNumber` input\n' +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }

  if (context.payload.pull_request && inputs.prNumber) {
    throw new Error(
      "You can't use `prNumber` while in the context of a pull request event.\n" +
        'Please check your setup: https://github.com/ivangabriele/find-and-replace-pull-request-body#usage',
    )
  }
}

function getNextPullRequestBody(pullRequest, inputs) {
  if (inputs.body.length) {
    return inputs.body
  } else if (inputs.isHtmlCommentTag) {
    return replaceHtmlCommentTag(pullRequest, inputs)
  } else {
    return findAndReplaceBody(pullRequest, inputs)
  }
}

function replaceHtmlCommentTag(pullRequest, inputs) {
  const findRegexp = new RegExp(`\<\!\-\- ${inputs.find} \-\-\>.*\<\!\-\- ${inputs.find} \-\-\>`, 's')
  const replacement = inputs.body.length
    ? inputs.body
    : `<!-- ${inputs.find} -->\n${inputs.replace}\n<!-- ${inputs.find} -->`

  return pullRequest.body.replace(findRegexp, replacement)
}

function findAndReplaceBody(pullRequest, inputs) {
  return pullRequest.body.replace(inputs.find, inputs.replace)
}

async function getPullRequestDetails(context, inputs, octokit) {
  if (context.payload.pull_request) {
    return {
      number: context.payload.pull_request.number,
      body: context.payload.pull_request.body,
    }
  } else {
    const { data: pullRequest } = await octokit.rest.pulls.get({
      ...context.repo,
      pull_number: parseInt(inputs.prNumber, 10),
    })

    return {
      number: pullRequest.number,
      body: pullRequest.body,
    }
  }
}
