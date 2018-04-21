
// Metrics are mapped to a particular column by the metricColumn array. The
// relative position of the metric name in this array equates to its column
// number in the memberMetrics array. Each event is assigned a weight which
// is used to calculate the HeartBeat score for each member and team.
const ACTIVITY_PASSIVE = 0;     // Activities performed for the member
const ACTIVITY_MANAGING = 1;    // Activities performed to manage the repo
const ACTIVITY_DEVELOPING = 2;  // Activities directly related to active development
const ACTIVITY_PUBLISHING = 3;  // Activities performed to publish an app

const ghEventMetrics = [
  { event: 'CommitCommentEvent', title: 'Commit Comment', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'CreateEvent', title: 'Create Repo/Branch/Tag', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'DeleteEvent', title: 'Delete Branch or Tag', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'DeploymentEvent', title: 'Deployment', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'DeploymentStatusEvent', title: 'Deployment Status', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'DownloadEvent', title: '', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'FollowEvent', title: '', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'ForkEvent', title: 'Fork Repo', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ForkApplyEvent', title: '', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'GistEvent', title: '', deprecated: true, weight: ACTIVITY_PASSIVE },
  { event: 'GollumEvent', title: 'Create/Update Wiki', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'InstallationEvent', title: 'Install/Uninstall App', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'InstallationRepositoriesEvent', title: 'Add/Remove Repo from Installation', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'IssueCommentEvent', title: 'Create/Edit/Delete Issue Comment', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'IssuesEvent', title: 'Add/Update Issue', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'LabelEvent', title: 'Add/Update/Delete Repo Label', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'MarketplacePurchaseEvent', title: 'Marketplace Activity', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'MemberEvent', title: 'Collaborator Activity', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'MembershipEvent', title: 'Add/Remove User from Team', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'MilestoneEvent', title: 'Milestone Activity', deprecated: false, weight: ACTIVITY_MANAGING },
  { event: 'OrganizationEvent', title: 'Organization Activity', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'OrgBlockEvent', title: 'Block/Unblock User from Org', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PageBuildEvent', title: 'Build GH Pages Site', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'ProjectCardEvent', title: 'Project Card Activity', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ProjectColumnEvent', title: 'Project Column Activity', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'ProjectEvent', title: 'Project Activity', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PublicEvent', title: 'Make Repo Public', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'PullRequestEvent', title: 'Pull Request', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'PullRequestReviewEvent', title: 'PR Review', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'PullRequestReviewCommentEvent', title: 'PR Review Comment', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'PushEvent', title: 'Push to Branch', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'ReleaseEvent', title: 'Release Activity', deprecated: false, weight: ACTIVITY_PUBLISHING },
  { event: 'RepositoryEvent', title: 'Create/Manage Repo', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'StatusEvent', title: 'Change Commit Status', deprecated: false, weight: ACTIVITY_DEVELOPING },
  { event: 'TeamEvent', title: 'Create/Remove Org Team', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'TeamAddEvent', title: 'Add Repo to Team', deprecated: false, weight: ACTIVITY_PASSIVE },
  { event: 'WatchEvent', title: 'Watch Repo',  deprecated: false, weight: ACTIVITY_MANAGING }
];

export { ACTIVITY_PASSIVE, ACTIVITY_MANAGING, ACTIVITY_DEVELOPING, ACTIVITY_PUBLISHING, ghEventMetrics };