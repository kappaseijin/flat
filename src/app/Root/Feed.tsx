import {
  useInfiniteQuery,
  type QueryKey,
  type QueryFunction,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import type { AppBskyFeedFeedViewPost } from "@atproto/api";
import { Spinner } from "@camome/core/Spinner";
import Post from "@/src/components/Post";
import InfiniteScroll from "react-infinite-scroller";
import SpinnerFill from "@/src/components/SpinnerFill";
import { Button } from "@camome/core/Button";
import { queryKeys } from "@/src/lib/queries";

import styles from "./Feed.module.scss";

export type FeedQueryFn<K extends QueryKey> = QueryFunction<
  {
    cursor?: string;
    feed: AppBskyFeedFeedViewPost.Main[];
  },
  K
>;

type Props<K extends QueryKey> = {
  queryKey: K;
  queryFn: FeedQueryFn<K>;
  fetchLatestOne: () => Promise<AppBskyFeedFeedViewPost.Main>;
  maxPages?: number;
};

export function Feed<K extends QueryKey>({
  queryKey,
  queryFn,
  fetchLatestOne,
  maxPages,
}: Props<K>) {
  const {
    status,
    data,
    error,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage, allPages) => {
      if (maxPages && allPages.length >= maxPages) return undefined;
      return lastPage.cursor ? { cursor: lastPage.cursor } : undefined;
    },
    staleTime: 60 * 3 * 1000,
  });
  const queryClient = useQueryClient();

  const allItems = data?.pages.flatMap((p) => p.feed) ?? [];
  const latestItem = allItems.at(0);
  const latestDate = latestItem
    ? new Date(latestItem.post.indexedAt)
    : undefined;
  const { data: isNewAvailable } = useQuery(
    queryKeys.feed.new.$(queryKey, latestDate, fetchLatestOne),
    async () => {
      if (!latestDate) return false;
      const latest = await fetchLatestOne();
      return new Date(latest.post.indexedAt).getTime() > latestDate.getTime();
    },
    {
      refetchInterval: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: !import.meta.env.PROD,
    }
  );

  const loadNewPosts = () => {
    // must scroll to top to prevent refetch at the bottom.
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    const refetchOnTop = () => {
      if (window.scrollY !== 0) {
        window.requestAnimationFrame(refetchOnTop);
        return;
      }
      // 1. remove all the pages except for the first.
      // 2. refetch the first page.
      queryClient.setQueryData(queryKey, (data: any) => ({
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      }));
      queryClient.invalidateQueries(queryKey);
    };
    window.requestAnimationFrame(refetchOnTop);
  };

  if (status === "loading") {
    return (
      <div className={styles.spinner}>
        <Spinner />
      </div>
    );
  } else if (status === "error") {
    return <span>Error: {(error as Error).message}</span>;
  }

  return (
    <>
      <InfiniteScroll
        pageStart={0}
        loadMore={() => !isFetchingNextPage && fetchNextPage()}
        hasMore={hasNextPage}
        loader={<SpinnerFill />}
      >
        <>
          {allItems.map((item) => (
            <Post data={item} />
          ))}
          {!hasNextPage && (
            <div className={styles.noMore}>nothing more to say...</div>
          )}
        </>
      </InfiniteScroll>
      {isNewAvailable && (
        <Button
          size="sm"
          onClick={loadNewPosts}
          className={styles.newItemBtn}
          disabled={isFetching}
        >
          Load new posts
        </Button>
      )}
    </>
  );
}
