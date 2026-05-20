import { WPlaceBot } from './bot'
import { t } from './i18n'

export class WPlaceBotError extends Error {
  public name = 'WPlaceBotError'
  public constructor(message: string, bot: WPlaceBot) {
    super(message)
    bot.widget.status = message
  }
}

export class NotInitializedError extends WPlaceBotError {
  public name = 'NotInitializedError'
  public constructor(bot: WPlaceBot) {
    super(t('error.notInitialized'), bot)
  }
}

export class NoImageError extends WPlaceBotError {
  public name = 'NoImageError'
  public constructor(bot: WPlaceBot) {
    super(t('error.noImage'), bot)
  }
}
