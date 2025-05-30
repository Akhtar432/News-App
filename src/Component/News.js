import React, { Component } from 'react';
import NewsItem from './NewsItem';
import Spinner from './Spinner';
import PropTypes from 'prop-types';
import InfiniteScroll from "react-infinite-scroll-component";

export class News extends Component {
    static defaultProps = {
        country: 'in',
        pageSize: 8,
        category: 'general',
    }

    static propTypes = {
        country: PropTypes.string,
        pageSize: PropTypes.number,
        category: PropTypes.string,
        apiKey: PropTypes.string.isRequired,
        setProgress: PropTypes.func.isRequired,
    }

    capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    constructor(props) {
        super(props);
        this.state = {
            articles: [],
            loading: true,
            page: 1,
            totalResults: 0,
            error: null
        }
        document.title = `${this.capitalizeFirstLetter(this.props.category)} - NewsMonkey`;
    }

    async updateNews() {
        try {
            this.props.setProgress(10);
            const url = `https://newsapi.org/v2/top-headlines?country=${this.props.country}&category=${this.props.category}&apiKey=${this.props.apiKey}&page=${this.state.page}&pageSize=${this.props.pageSize}`;
            this.setState({ loading: true, error: null });
            
            const response = await fetch(url);
            this.props.setProgress(30);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const parsedData = await response.json();
            this.props.setProgress(70);
            
            if (parsedData.status !== "ok") {
                throw new Error(parsedData.message || "News API error");
            }

            this.setState({
                articles: parsedData.articles || [],
                totalResults: parsedData.totalResults || 0,
                loading: false,
            });
        } catch (error) {
            console.error("Error fetching news:", error);
            this.setState({
                loading: false,
                error: error.message,
                articles: []
            });
        } finally {
            this.props.setProgress(100);
        }
    }

    componentDidMount() {
        this.updateNews();
    }

    fetchMoreData = async () => {
        try {
            const nextPage = this.state.page + 1;
            const url = `https://newsapi.org/v2/top-headlines?country=${this.props.country}&category=${this.props.category}&apiKey=${this.props.apiKey}&page=${nextPage}&pageSize=${this.props.pageSize}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const parsedData = await response.json();
            
            if (parsedData.status !== "ok") {
                throw new Error(parsedData.message || "News API error");
            }

            this.setState({
                articles: [...this.state.articles, ...(parsedData.articles || [])],
                totalResults: parsedData.totalResults || 0,
                page: nextPage
            });
        } catch (error) {
            console.error("Error fetching more news:", error);
            this.setState({ error: error.message });
        }
    };

    render() {
        const { articles, loading, error, totalResults } = this.state;

        if (error) {
            return (
                <div className="container text-center my-5">
                    <h2>Error Loading News</h2>
                    <p className="text-danger">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => this.updateNews()}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (loading && articles.length === 0) {
            return <Spinner />;
        }

        if (articles.length === 0 && !loading) {
            return (
                <div className="container text-center my-5">
                    <h2>No Articles Found</h2>
                    <p>Try refreshing or check back later.</p>
                </div>
            );
        }

        return (
            <>
                <h1 className="text-center" style={{ margin: '35px 0px', marginTop: '90px' }}>
                    NewsApp - Top {this.capitalizeFirstLetter(this.props.category)} Headlines
                </h1>
                
                <InfiniteScroll
                    dataLength={articles.length}
                    next={this.fetchMoreData}
                    hasMore={articles.length < totalResults}
                    loader={<Spinner />}
                >
                    <div className="container">
                        <div className="row">
                            {articles.map((element, index) => (
                                <div className="col-md-4" key={index}>
                                    <NewsItem
                                        title={element.title || ""}
                                        description={element.description || ""}
                                        imageUrl={element.urlToImage}
                                        newsUrl={element.url}
                                        author={element.author}
                                        date={element.publishedAt}
                                        source={element.source?.name || "Unknown"}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </InfiniteScroll>
            </>
        );
    }
}

export default News;