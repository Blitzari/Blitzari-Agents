from typing import List, Union, Tuple

def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True,
    with_intervals: bool = False
) -> Union[List[float], List[int], List[Tuple[int, float]], List[Tuple[int, int]]]:
    """
    Bucket activity counts into 'buckets' time intervals.
    
    Args:
        timestamps: List of epoch ms timestamps.
        counts: List of integer counts per timestamp (must match timestamps length).
        buckets: Number of buckets to divide into (default 10).
        normalize: If True, output values are normalized to [0.0 – 1.0].
        with_intervals: If True, returns tuples (bucket_start_timestamp, value).

    Returns:
        List of bucket values (float if normalized, int otherwise).
        Or list of tuples if with_intervals=True.
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return []

    t_min, t_max = min(timestamps), max(timestamps)
    span = t_max - t_min or 1
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        m = max(agg) or 1
        agg = [round(val / m, 4) for val in agg]

    if with_intervals:
        return [(int(t_min + i * bucket_size), agg[i]) for i in range(buckets)]
    return agg
