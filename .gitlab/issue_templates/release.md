- **Version:** (Release version string)
- **Milestone:** (Link to milestone)

## QA checklist

### Pre-testing

- [ ] all spec branches are merged to `abp-ui-next` ([spec repository](https://gitlab.com/adblockinc/ext/adblockplus/spec/-/tree/master/spec/abp)) _[@person_responsible]_
- [ ] regression tests are updated ([cucumber project](https://studio.cucumber.io/projects/283030)) _[@person_responsible]_
- [ ] testpages autotests are passing _[@person_responsible]_
- [ ] E2E autotests are passing _[@person_responsible]_
- [ ] test runs are created _[@person_responsible]_

### Release testing

- [ ] **chrome latest** (Link to testrun) _[@person_responsible]_
- [ ] **firefox latest** (Link to testrun) _[@person_responsible]_
- [ ] **edge latest** (Link to testrun) _[@person_responsible]_
- [ ] **opera latest** (Link to testrun) _[@person_responsible]_
- [ ] **yandex latest** (Link to testrun) _[@person_responsible]_
- [ ] **chrome minimum** (Link to testrun) _[@person_responsible]_
- [ ] **firefox minimum** (Link to testrun) _[@person_responsible]_
- [ ] **chrome misc** (Link to testrun) _[@person_responsible]_

### Post-release

- [ ] merge spec branch `abp-ui-next` to `master` ([spec repository](https://gitlab.com/adblockinc/ext/adblockplus/spec/-/tree/master/spec/abp))

/milestone %MILESTONE
/label ~"Product:: ABP"
