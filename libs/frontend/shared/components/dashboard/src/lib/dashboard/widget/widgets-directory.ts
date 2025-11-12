import { WidgetDashboard } from '../models/dashboard';
import ChannelAnalyticsComponent from '../widgets/channel-analytics.component';
import { IdeasComponent } from '../widgets/ideas.component';
import LatestCommentsComponent from '../widgets/latest-comments.component';
import LatestVideoComponent from '../widgets/latest-video.component';
import { PublishedVideosComponent } from '../widgets/published-videos.component';
import { RevenueComponent } from '../widgets/revenue.component';
import { SubscribersComponent } from '../widgets/subscribers.component';
import { TrafficSourcesComponent } from '../widgets/traffic-sources.component';
import { ViewsComponent } from '../widgets/views.component';
import { WatchTimeComponent } from '../widgets/watch-time.component';

export const widgetsDirectory: WidgetDashboard[] = [
  {
    id: 1,
    label: 'Channel Analytics',
    content: ChannelAnalyticsComponent,
    rows: 2,
    columns: 2,
  },
  {
    id: 2,
    label: 'Latest Comments',
    content: LatestCommentsComponent,
    rows: 2,
    columns: 1,
  },
  {
    id: 3,
    label: 'Latest Video',
    content: LatestVideoComponent,
    rows: 2,
    columns: 2,
  },
  {
    id: 5,
    label: 'Subscribers',
    content: SubscribersComponent,
    rows: 1,
    columns: 1,
    backgroundColor: '#003f5c',
    color: 'whitesmoke',
  },
  {
    id: 6,
    label: 'Views',
    content: ViewsComponent,
    rows: 1,
    columns: 1,
    backgroundColor: '#003f5c',
    color: 'whitesmoke',
  },
  {
    id: 7,
    label: 'Watch Time',
    content: WatchTimeComponent,
    rows: 1,
    columns: 1,
    backgroundColor: '#003f5c',
    color: 'whitesmoke',
  },
  {
    id: 8,
    label: 'Revenue',
    content: RevenueComponent,
    rows: 1,
    columns: 1,
    backgroundColor: '#003f5c',
    color: 'whitesmoke',
  },
  {
    id: 9,
    label: 'Traffic sources',
    content: TrafficSourcesComponent,
    rows: 2,
    columns: 2,
  },
  {
    id: 10,
    label: 'Published videos',
    content: PublishedVideosComponent,
    rows: 2,
    columns: 2,
  },
  {
    id: 11,
    label: 'Ideas for you',
    content: IdeasComponent,
    rows: 1,
    columns: 1,
  },
];
