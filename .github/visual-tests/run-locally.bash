#!/usr/bin/env bash

export DOMAIN_MAIN="main--24life--hlxsites.hlx.live"
export DOMAIN_BRANCH="author-bug--24life--hlxsites.hlx.live"

export TEST_PATHS="/ /block-library/blocks/columns /block-library/blocks/card /block-library/blocks/article-hero /block-library/blocks/article-author /block-library/blocks/article-list /block-library/blocks/article-carousel /block-library/blocks/magazine-hero /block-library/blocks/quote /block-library/blocks/youtube /block-library/blocks/spotify /block-library/blocks/carousel /block-library/blocks/article-hero-video /block-library/blocks/video /block-library/blocks/author-list /block-library/blocks/float-images"

# we ignore the exit code of the test command because we want to continue
npx playwright test
set -e

cat test-results/visual-diff.md
