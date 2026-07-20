import backtrader as bt

class NSEIntradayBTStrategy(bt.Strategy):
    params = (
        ('rsi_length', 14),
        ('macd_fast', 12),
        ('macd_slow', 26),
        ('macd_signal', 9),
        ('ema_length', 20),
    )

    def __init__(self):
        self.rsi = bt.indicators.RSI_SMA(self.data.close, period=self.params.rsi_length)
        self.macd = bt.indicators.MACD(self.data.close, 
                                       period_me1=self.params.macd_fast, 
                                       period_me2=self.params.macd_slow, 
                                       period_signal=self.params.macd_signal)
        self.ema = bt.indicators.EMA(self.data.close, period=self.params.ema_length)

    def next(self):
        if not self.position:
            # Entry logic
            rsi_turned_up = self.rsi[-1] < 30 and self.rsi[0] > self.rsi[-1]
            macd_bullish = self.macd.macd[-1] < self.macd.signal[-1] and self.macd.macd[0] > self.macd.signal[0]
            price_above_ema = self.data.close[0] > self.ema[0]
            
            if rsi_turned_up and macd_bullish and price_above_ema:
                self.buy()
        else:
            # Exit logic
            if self.rsi[0] > 70 or (self.macd.macd[-1] > self.macd.signal[-1] and self.macd.macd[0] < self.macd.signal[0]):
                self.sell()

def run_backtest(data_path: str):
    cerebro = bt.Cerebro()
    cerebro.addstrategy(NSEIntradayBTStrategy)
    
    # Load data (assuming Yahoo Finance CSV format for now)
    data = bt.feeds.YahooFinanceCSVData(
        dataname=data_path,
        reverse=False
    )
    cerebro.adddata(data)
    
    cerebro.broker.setcash(100000.0)
    
    # Analyzers
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')
    
    print('Starting Portfolio Value: %.2f' % cerebro.broker.getvalue())
    results = cerebro.run()
    print('Final Portfolio Value: %.2f' % cerebro.broker.getvalue())
    
    strat = results[0]
    print('Sharpe Ratio:', strat.analyzers.sharpe.get_analysis())
    print('DrawDown:', strat.analyzers.drawdown.get_analysis())
    
    cerebro.plot()

if __name__ == '__main__':
    pass
