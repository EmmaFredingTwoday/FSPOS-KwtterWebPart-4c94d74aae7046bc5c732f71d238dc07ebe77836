import React, { useState } from "react";
import { getSP } from '../pnpjsConfig';
import { Icon } from '@fluentui/react/lib/Icon';
import dayjs from 'dayjs'; 
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './FsposKwitter.module.scss';

dayjs.extend(relativeTime);
require('dayjs/locale/sv');

interface IKwitterPostProps {
  showAll: boolean;
  items: any[];
  handleItemUpdate: (updatedItem: any) => void;
  currentUser: any;
  popularThreshold?: number;
  list: string;
}

const KwitterPost: React.FC<IKwitterPostProps> = ({ showAll, items, handleItemUpdate, currentUser, popularThreshold = 300000000, ...props }) => {
  const currentUserId = currentUser.loginName;
  const _sp = React.useRef(getSP());
  dayjs.locale('sv');

  const [currentFilter, setCurrentFilter] = useState('');
  const [currentMention, setCurrentMention] = useState('');
  const [sortType, setSortType] = useState<'default' | 'latest' | 'mostLikes'>('default');

  const updateLikedBy = async (item: any, updatedLikes: number, updatedLikedByArray: string[]) => {
    await _sp.current.web.lists.getByTitle(props.list).items.getById(item.Id).update({
      Likes: updatedLikes,
      Likedby: JSON.stringify(updatedLikedByArray)
    });
  };

  const sortRegularPosts = (posts: any[]) => {
    if (sortType === 'latest') {
      return [...posts].sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());
    }
    if (sortType === 'mostLikes') {
      return [...posts].sort((a, b) => b.Likes - a.Likes);
    }
    return posts;  // default sort
  };

  const onLike = async (item: any) => {
    const likedByArray = item.Likedby ? JSON.parse(item.Likedby) : [];
    let updatedLikes = item.Likes;
    let updatedLikedByArray = [...likedByArray];

    if (likedByArray.includes(currentUserId)) {
      updatedLikes -= 1;
      updatedLikedByArray = updatedLikedByArray.filter(id => id !== currentUserId);
    } else {
      updatedLikes += 1;
      updatedLikedByArray.push(currentUserId);
    }

    await updateLikedBy(item, updatedLikes, updatedLikedByArray);
    const userHasLiked = updatedLikedByArray.indexOf(currentUserId) >= 0;
    const updatedItem = { ...item, Likedby: JSON.stringify(updatedLikedByArray), Likes: updatedLikes, likedByUser: userHasLiked };
    handleItemUpdate(updatedItem);
  };

  const filterItemsByUser = (items: any[]) => {
    if (showAll) return items;
    let displayName = '@';
    displayName += currentUser.displayName.replace(' ', '_')
    let result = items.filter(item => item.content.toString().includes(displayName));
    console.log("Results " + result)
    return items.filter(item => item.Title);
  };

  const filterItemsByHashtag = (items: any[]) => {
    if (!currentFilter) return items;
    return items.filter(item => {
      const hashtags = item.hashtag ? JSON.parse(item.hashtag) : [];
      return hashtags.includes(currentFilter);
    });
  };

  const filterItemsByMention = (items: any[]) => {
    if (!currentMention) return items;
    // Extract username from the currentMention (i.e., remove the '@' symbol)
    const mentionedUser = currentMention.replace('@', '').replace(/_/g, ' ').toLowerCase();
    const revertMentionTag = currentMention.replace(/ /g, '_').toLowerCase();
   // console.log("Mentioned user: " + mentionedUser);
    return items.filter(item => {
      console.log("item.Text");
      return item.Title.toLowerCase() === mentionedUser ||               
             (item.Text && item.Text.toLowerCase().includes(revertMentionTag));
    });
  };
  
  const renderHashtags = (hashtagString: string) => {
    const hashtags = hashtagString ? JSON.parse(hashtagString) : [];
    if (hashtags.length === 0 || hashtags[0] === '') return null;
    return hashtags.map((hashtag: any, index: any) => (
      <span key={index} onClick={() => setCurrentFilter(hashtag)} className={styles.hashtag}>#{hashtag}</span>
    ));
  };

  const renderMentions = (text: string) => {
    const mentionRegex = /(@[\p{L}\d_]+)/gu;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      if (part.indexOf('@') === 0) {
        // Replacing underscores with spaces
        let cleanMention = part.replace(/_/g, ' ');
        return (
          <span 
              key={index} 
              onClick={() => setCurrentMention(cleanMention)} 
              className={styles.mention ? styles.mention : ''}
          >
              {cleanMention}
          </span>
        );
      }
      console.log("Part " + part)
      return part;
    });
  };

  const getSeparatedPosts = (items: any[], threshold: number) => {
    const filteredItems = filterItemsByMention(filterItemsByHashtag(filterItemsByUser(items)));
    const popularPosts = filteredItems.filter(item => item.Likes > threshold).slice(0, 3);
    const regularPosts = filteredItems.filter(item => popularPosts.indexOf(item) === -1);
    return {
      popularPosts,
      regularPosts
    };
  };

  const { popularPosts, regularPosts } = getSeparatedPosts(items, popularThreshold);
  const sortedRegularPosts = sortRegularPosts(regularPosts);
  return (
    <div style={{'height': '700px', 'overflow': 'scroll'}}>
      {currentFilter && (
        <div>
          Filter: #{currentFilter}
          <button onClick={() => setCurrentFilter('')}>Rensa filter</button>
        </div>
      )}
      {currentMention && (
        <div>
          Filter: {currentMention}
          <button onClick={() => setCurrentMention('')}>Rensa filter</button>
        </div>
      )}
      <section>
        <div>
          <button onClick={() => setSortType('latest')}>Nyaste</button>
          <button onClick={() => setSortType('mostLikes')}>Populäraste</button>
        </div>
        {/* Render popular posts */}
        {popularPosts.map((item: any) => (
          <div style={{'border': '1px solid gray'}} className={styles["tweet-wrap"]} key={item.Id}>
            <img src={item.fulllogourl} className={styles.profileImage} alt="Profile" />
            <div className={styles["tweet-header"]}>
              <div className="tweet-header-info">
                <span style={{margin:'5px'}}>@{item.Title}</span> <span> {dayjs(item.Created).fromNow()} </span>
                <p>{renderMentions(item.Text)}</p>
                <div className={styles["overflowWrap"]}>{renderHashtags(item.hashtag)}</div>
                <div className={styles["tweet-info-counts"]}>
                <Icon iconName={JSON.parse(item.Likedby || "[]").indexOf(currentUserId) >= 0 ? "LikeSolid" : "Like" } onClick={() => onLike(item)} />
                  <div className={styles.likes}>{item.Likes}</div>
                  <Icon iconName="hashtag" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Render regular posts */}
        {sortedRegularPosts.map((item: any) => (
          <div className={styles["tweet-wrap"]} key={item.Id}>
            <img src={item.fulllogourl} className={styles.profileImage} alt="Profile" />
            <div className={styles["tweet-header"]}>
              <div className="tweet-header-info">
                <span style={{margin:'5px'}}>@{item.Title}</span> <span> {dayjs(item.Created).fromNow()} </span>
                <p>{renderMentions(item.Text)}</p>
                <div className={styles["overflowWrap"]}>{renderHashtags(item.hashtag)}</div>
                <div className={styles["tweet-info-counts"]}>
                <Icon iconName={JSON.parse(item.Likedby || "[]").indexOf(currentUserId) >= 0 ? "LikeSolid" : "Like" } onClick={() => onLike(item)} />
                  <div className={styles.likes}>{item.Likes}</div>
                  <Icon iconName="hashtag" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default KwitterPost;
