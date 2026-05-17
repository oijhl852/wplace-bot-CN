import { WPlaceBot } from './bot'

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
    super('❌ 未初始化', bot)
  }
}

export class NoImageError extends WPlaceBotError {
  public name = 'NoImageError'
  public constructor(bot: WPlaceBot) {
    super('❌ 未选择图片', bot)
  }
}
