import {
  Activity,
  Presence,
} from 'eris'

export const computeActivity = (presence: Presence): Activity | undefined => {
  let activity: Activity | undefined

  for (const act of presence.activities ?? []) {
    if (act.type < 4 && // && activity?.type !== 1
      (
        !activity || act.type === 1 ||
        (!activity.assets && !!act.assets) ||
        (
          activity.created_at < act.created_at &&
          !(activity.assets && !act.assets)
        )
      )
    ) {
      activity = act
    }
  }

  return activity
}
