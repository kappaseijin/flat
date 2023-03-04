import { formatDistanceShort } from "@/src/lib/time";
import { AppBskyFeedFeedViewPost } from "@atproto/api";
import { BsReplyFill } from "react-icons/bs";
import { FaRetweet } from "react-icons/fa";
import { Avatar } from "@camome/core/Avatar";
import { Tag } from "@camome/core/Tag";

import styles from "./Post.module.scss";

type Props = {
  data: AppBskyFeedFeedViewPost.Main;
};

export default function Post({ data }: Props) {
  const { post, reason, reply } = data;
  return (
    <article className={styles.container}>
      {reply && (
        <Tag
          colorScheme="neutral"
          size="sm"
          startDecorator={<BsReplyFill />}
          className={styles.tag}
        >
          Reply to{" "}
          {reply.parent.author.displayName ?? `@${reply.parent.author.handle}`}
        </Tag>
      )}
      {reason && AppBskyFeedFeedViewPost.isReasonRepost(reason) && (
        <Tag
          colorScheme="neutral"
          size="sm"
          startDecorator={<FaRetweet />}
          className={styles.tag}
        >
          Reposted by {reason.by.displayName}
        </Tag>
      )}
      <div className={styles.main}>
        <div className={styles.left}>
          <Avatar
            src={post.author.avatar}
            alt={`Avatar of ${post.author?.displayName}`}
            size="sm"
          />
        </div>
        <div className={styles.right}>
          <div className={styles.header}>
            <span className={styles.displayName}>
              {post.author.displayName}
            </span>
            <span className={styles.name}>
              @{post.author.handle.replace(".bsky.social", "")}
            </span>
            <time dateTime={post.indexedAt} className={styles.time}>
              {formatDistanceShort(new Date(post.indexedAt))}
            </time>
          </div>
          <div className={styles.body}>{(post.record as any).text}</div>
        </div>
      </div>
    </article>
  );
}

type ReactionProps = {
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
  ["aria-label"]: string;
};

function Reaction({ icon, count, onClick, ...props }: ReactionProps) {
  return (
    <button aria-label={props["aria-label"]} onClick={onClick}>
      {icon}
      <span aria-hidden>{count}</span>
    </button>
  );
}
