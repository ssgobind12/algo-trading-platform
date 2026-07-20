import pandas as pd
import numpy as np

def calculate_rsi(df: pd.DataFrame, length=14, close_col="close"):
    delta = df[close_col].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=length).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=length).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(df: pd.DataFrame, fast=12, slow=26, signal=9, close_col="close"):
    ema_fast = df[close_col].ewm(span=fast, adjust=False).mean()
    ema_slow = df[close_col].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_df = pd.DataFrame()
    macd_df[f"MACD_{fast}_{slow}_{signal}"] = macd_line
    macd_df[f"MACDs_{fast}_{slow}_{signal}"] = signal_line
    return macd_df

def calculate_ema(df: pd.DataFrame, length=20, close_col="close"):
    return df[close_col].ewm(span=length, adjust=False).mean()

def calculate_vwap(df: pd.DataFrame, high_col="high", low_col="low", close_col="close", volume_col="volume"):
    q = df[volume_col]
    p = (df[high_col] + df[low_col] + df[close_col]) / 3
    return (p * q).cumsum() / q.cumsum()

def calculate_atr(df: pd.DataFrame, length=14, high_col="high", low_col="low", close_col="close"):
    high_low = df[high_col] - df[low_col]
    high_close = np.abs(df[high_col] - df[close_col].shift())
    low_close = np.abs(df[low_col] - df[close_col].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    return true_range.rolling(window=length).mean()

def append_all_indicators(df: pd.DataFrame):
    df['RSI'] = calculate_rsi(df)
    df['MACD'], df['MACD_SIGNAL'] = calculate_macd(df)
    df['EMA_20'] = calculate_ema(df, 20)
    df['VWAP'] = calculate_vwap(df)
    df['ATR'] = calculate_atr(df)
    return df
