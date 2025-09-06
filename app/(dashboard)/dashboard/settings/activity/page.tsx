import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  FileText,
  MessageCircle,
  Heart,
  Eye,
  UserCheck,
  Shield,
  CreditCard,
  Clock,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';

const iconMap: Record<ActivityType, LucideIcon> = {
  // Authentication
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.EMAIL_VERIFIED]: CheckCircle,
  
  // Account management
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_PROFILE]: Settings,
  [ActivityType.UPDATE_PREFERENCES]: Settings,
  
  // Posts
  [ActivityType.CREATE_POST]: FileText,
  [ActivityType.UPDATE_POST]: FileText,
  [ActivityType.DELETE_POST]: UserMinus,
  [ActivityType.VIEW_POST]: Eye,
  
  // Comments
  [ActivityType.CREATE_COMMENT]: MessageCircle,
  [ActivityType.UPDATE_COMMENT]: MessageCircle,
  [ActivityType.DELETE_COMMENT]: UserMinus,
  
  // Reactions
  [ActivityType.REACT_TO_POST]: Heart,
  [ActivityType.REACT_TO_COMMENT]: Heart,
  [ActivityType.REMOVE_REACTION]: UserMinus,
  
  // Social interactions
  [ActivityType.FOLLOW_USER]: UserCheck,
  [ActivityType.UNFOLLOW_USER]: UserMinus,
  [ActivityType.BLOCK_USER]: Shield,
  [ActivityType.UNBLOCK_USER]: UserCheck,
  [ActivityType.VIEW_PROFILE]: Eye,
  
  // Teams
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.UPDATE_TEAM]: Settings,
  [ActivityType.DELETE_TEAM]: UserMinus,
  [ActivityType.JOIN_TEAM]: CheckCircle,
  [ActivityType.LEAVE_TEAM]: LogOut,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.DECLINE_INVITATION]: UserMinus,
  
  // Subscriptions
  [ActivityType.SUBSCRIBE]: CreditCard,
  [ActivityType.UNSUBSCRIBE]: UserMinus,
  [ActivityType.UPGRADE_SUBSCRIPTION]: CreditCard,
  [ActivityType.DOWNGRADE_SUBSCRIPTION]: CreditCard,
};

const activityCategories: Record<string, string[]> = {
  authentication: [ActivityType.SIGN_UP, ActivityType.SIGN_IN, ActivityType.SIGN_OUT, ActivityType.EMAIL_VERIFIED],
  account: [ActivityType.UPDATE_PASSWORD, ActivityType.DELETE_ACCOUNT, ActivityType.UPDATE_PROFILE, ActivityType.UPDATE_PREFERENCES],
  content: [ActivityType.CREATE_POST, ActivityType.UPDATE_POST, ActivityType.DELETE_POST, ActivityType.VIEW_POST, ActivityType.CREATE_COMMENT, ActivityType.UPDATE_COMMENT, ActivityType.DELETE_COMMENT],
  social: [ActivityType.REACT_TO_POST, ActivityType.REACT_TO_COMMENT, ActivityType.REMOVE_REACTION, ActivityType.FOLLOW_USER, ActivityType.UNFOLLOW_USER, ActivityType.BLOCK_USER, ActivityType.UNBLOCK_USER, ActivityType.VIEW_PROFILE],
  teams: [ActivityType.CREATE_TEAM, ActivityType.UPDATE_TEAM, ActivityType.DELETE_TEAM, ActivityType.JOIN_TEAM, ActivityType.LEAVE_TEAM, ActivityType.REMOVE_TEAM_MEMBER, ActivityType.INVITE_TEAM_MEMBER, ActivityType.ACCEPT_INVITATION, ActivityType.DECLINE_INVITATION],
  subscription: [ActivityType.SUBSCRIBE, ActivityType.UNSUBSCRIBE, ActivityType.UPGRADE_SUBSCRIPTION, ActivityType.DOWNGRADE_SUBSCRIPTION],
};

const categoryColors: Record<string, string> = {
  authentication: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  account: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  content: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  social: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  teams: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  subscription: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  other: 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
};

function getActivityCategory(action: ActivityType): string {
  for (const [category, actions] of Object.entries(activityCategories)) {
    if (actions.includes(action)) {
      return category;
    }
  }
  return 'other';
}

function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'HH:mm')}`;
  }
  
  return format(date, 'MMM d, yyyy \'at\' HH:mm');
}

function formatDateKey(timestamp: Date): string {
  return format(timestamp, 'yyyy-MM-dd');
}

function formatTimeDisplay(timestamp: Date): string {
  return format(timestamp, 'HH:mm');
}

function formatDateTimeAttribute(timestamp: Date): string {
  return timestamp.toISOString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    // Authentication
    case ActivityType.SIGN_UP: return 'You signed up';
    case ActivityType.SIGN_IN: return 'You signed in';
    case ActivityType.SIGN_OUT: return 'You signed out';
    case ActivityType.EMAIL_VERIFIED: return 'You verified your email';
    
    // Account management
    case ActivityType.UPDATE_PASSWORD: return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT: return 'You deleted your account';
    case ActivityType.UPDATE_PROFILE: return 'You updated your profile';
    case ActivityType.UPDATE_PREFERENCES: return 'You updated your preferences';
    
    // Posts
    case ActivityType.CREATE_POST: return 'You created a post';
    case ActivityType.UPDATE_POST: return 'You updated a post';
    case ActivityType.DELETE_POST: return 'You deleted a post';
    case ActivityType.VIEW_POST: return 'You viewed a post';
    
    // Comments
    case ActivityType.CREATE_COMMENT: return 'You commented on a post';
    case ActivityType.UPDATE_COMMENT: return 'You updated a comment';
    case ActivityType.DELETE_COMMENT: return 'You deleted a comment';
    
    // Reactions
    case ActivityType.REACT_TO_POST: return 'You reacted to a post';
    case ActivityType.REACT_TO_COMMENT: return 'You reacted to a comment';
    case ActivityType.REMOVE_REACTION: return 'You removed a reaction';
    
    // Social interactions
    case ActivityType.FOLLOW_USER: return 'You followed a user';
    case ActivityType.UNFOLLOW_USER: return 'You unfollowed a user';
    case ActivityType.BLOCK_USER: return 'You blocked a user';
    case ActivityType.UNBLOCK_USER: return 'You unblocked a user';
    case ActivityType.VIEW_PROFILE: return 'You viewed a profile';
    
    // Teams
    case ActivityType.CREATE_TEAM: return 'You created a team';
    case ActivityType.UPDATE_TEAM: return 'You updated team settings';
    case ActivityType.DELETE_TEAM: return 'You deleted a team';
    case ActivityType.JOIN_TEAM: return 'You joined a team';
    case ActivityType.LEAVE_TEAM: return 'You left a team';
    case ActivityType.REMOVE_TEAM_MEMBER: return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER: return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION: return 'You accepted an invitation';
    case ActivityType.DECLINE_INVITATION: return 'You declined an invitation';
    
    // Subscriptions
    case ActivityType.SUBSCRIBE: return 'You subscribed to a plan';
    case ActivityType.UNSUBSCRIBE: return 'You cancelled your subscription';
    case ActivityType.UPGRADE_SUBSCRIPTION: return 'You upgraded your subscription';
    case ActivityType.DOWNGRADE_SUBSCRIPTION: return 'You downgraded your subscription';
    
    default:
      return 'Unknown action occurred';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  // Group activities by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = formatDateKey(log.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Track your recent activities and account changes
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {logs.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dayLogs = groupedLogs[date];
              const dateObj = parseISO(date);
              
              return (
                <Card key={date} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">
                        {isToday(dateObj) 
                          ? 'Today' 
                          : isYesterday(dateObj) 
                            ? 'Yesterday' 
                            : format(dateObj, 'EEEE, MMMM d, yyyy')
                        }
                      </CardTitle>
                      <Badge variant="secondary" className="ml-auto">
                        {dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {dayLogs.map((log, index) => {
                        const Icon = iconMap[log.action as ActivityType] || Settings;
                        const formattedAction = formatAction(log.action as ActivityType);
                        const category = getActivityCategory(log.action as ActivityType);
                        const categoryColor = categoryColors[category] || categoryColors.other;

                        return (
                          <div key={log.id}>
                            <div className="flex items-start gap-4 group">
                              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                <AvatarFallback className={`${categoryColor}`}>
                                  <Icon className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                      {formattedAction}
                                    </p>
                                    {log.ipAddress && (
                                      <p className="text-xs text-muted-foreground">
                                        from IP {log.ipAddress}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {category}
                                    </Badge>
                                    <time className="text-xs text-muted-foreground" dateTime={formatDateTimeAttribute(log.timestamp)}>
                                      {formatTimeDisplay(log.timestamp)}
                                    </time>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(log.timestamp)}
                                </p>
                              </div>
                            </div>
                            
                            {index < dayLogs.length - 1 && (
                              <Separator className="my-4 ml-14" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Summary Card */}
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      <CheckCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs text-muted-foreground">
                        You've viewed all your recent activity
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No activity yet</CardTitle>
                <CardDescription className="max-w-sm">
                  When you perform actions like signing in, updating your profile, or creating content, they'll appear here.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
