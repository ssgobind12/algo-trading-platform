import pandas as pd
import pandas_ta as ta

def calculate_rsi(df: pd.DataFrame, length=14, close_col="close"):
    return ta.rsi(df[close_col], length=length)

def calculate_macd(df: pd.DataFrame, fast=12, slow=26, signal=9, close_col="close"):
    return ta.macd(df[close_col], fast=fast, slow=slow, signal=signal)

def calculate_ema(df: pd.DataFrame, length=20, close_col="close"):
    return ta.ema(df[close_col], length=length)

def calculate_vwap(df: pd.DataFrame, high_col="high", low_col="low", close_col="close", volume_col="volume"):
    return ta.vwap(high=df[high_col], low=df[low_col], close=df[close_col], volume=df[volume_col])

def calculate_atr(df: pd.DataFrame, length=14, high_col="high", low_col="low", close_col="close"):
    return ta.atr(high=df[high_col], low=df[low_col], close=df[close_col], length=length)

def calculate_supertrend(df: pd.DataFrame, length=7, multiplier=3.0, high_col="high", low_col="low", close_col="close"):
    return ta.supertrend(high=df[high_col], low=df[low_col], close=df[close_col], length=length, multiplier=multiplier)

def calculate_adx(df: pd.DataFrame, length=14, high_col="high", low_col="low", close_col="close"):
    return ta.adx(high=df[high_col], low=df[low_col], close=df[close_col], length=length)

def calculate_bollinger_bands(df: pd.DataFrame, length=20, std=2.0, close_col="close"):
    return ta.bbands(df[close_col], length=length, std=std)

def append_all_indicators(df: pd.DataFrame):
    df.ta.rsi(length=14, append=True)
    df.ta.macd(fast=12, slow=26, signal=9, append=True)
    df.ta.ema(length=20, append=True)
    df.ta.vwap(append=True)
    df.ta.atr(length=14, append=True)
    return df
