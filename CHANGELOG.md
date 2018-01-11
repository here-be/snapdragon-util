# Release history

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<details>
  <summary><strong>Guiding Principles</strong></summary>

- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each versions is displayed.
- Mention whether you follow Semantic Versioning.

</details>

<details>
  <summary><strong>Types of changes</strong></summary>

Changelog entries are classified using the following labels _(from [keep-a-changelog](http://keepachangelog.com/)_):

* `added`: for new features
* `changed`: for changes in existing functionality
* `deprecated`: for once-stable features removed in upcoming releases
* `removed`: for deprecated features removed in this release
* `fixed`: for any bug fixes

Custom labels used in this repository:

* `dependencies`: bumps dependencies
* `housekeeping`: code re-organization, minor edits, or other changes that don't fit in one of the other categories.

</details>


### [5.0.0] - 2018-01-11

**Changes**

- Adds support for `node.value`, in anticipation of snapdragon v1.0.0.


### [4.0.0] - 2017-11-01

**Dependencies**

- Updated `kind-of` to version 6.0

### [3.0.0] - 2017-05-01

**Changed**

- `.emit` was renamed to [.append](README.md#append)
- `.addNode` was renamed to [.pushNode](README.md#pushNode)
- `.getNode` was renamed to [.findNode](README.md#findNode)
- `.isEmptyNodes` was renamed to [.isEmpty](README.md#isEmpty): also now works with `node.nodes` and/or `node.val`

**Added**

- [.identity](README.md#identity)
- [.removeNode](README.md#removeNode)
- [.shiftNode](README.md#shiftNode)
- [.popNode](README.md#popNode)

### 0.1.0

First release.

[keep-a-changelog]: https://github.com/olivierlacan/keep-a-changelog

[5.0.0]: https://github.com/here-be/snapdragon-util/compare/4.0.0...5.0.0
[4.0.0]: https://github.com/here-be/snapdragon-util/compare/4.0.0...3.0.0
[3.0.1]: https://github.com/here-be/snapdragon-util/compare/3.0.0...3.0.1
[3.0.0]: https://github.com/here-be/snapdragon-util/compare/2.1.1...3.0.0

[Unreleased]: https://github.com/here-be/snapdragon-util/compare/0.1.1...HEAD
[keep-a-changelog]: https://github.com/olivierlacan/keep-a-changelog

